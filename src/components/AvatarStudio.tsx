"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { getScopeClient } from "@/lib/scope";
import { DEFAULT_AVATAR_CONFIG, DEFAULT_GENERATION_PARAMS, type IceCandidatePayload } from "@/lib/scope/types";
import { WebcamPreview } from "./WebcamPreview";
import { ReferenceImage } from "./ReferenceImage";
import { PromptEditor } from "./PromptEditor";
import { OutputPreview } from "./OutputPreview";

interface AvatarStudioProps {
  onConnectionChange: (connected: boolean) => void;
}

export function AvatarStudio({ onConnectionChange }: AvatarStudioProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [prompt, setPrompt] = useState(DEFAULT_AVATAR_CONFIG.promptTemplate);
  const [vaceScale, setVaceScale] = useState(DEFAULT_AVATAR_CONFIG.vaceScale);
  const [isStreaming, setIsStreaming] = useState(false);
  const [referenceImage, setReferenceImage] = useState<string>("/metadj-avatar-reference.png");
  const [outputStream, setOutputStream] = useState<MediaStream | null>(null);
  const outputStreamRef = useRef<MediaStream | null>(null);
  const peerConnectionRef = useRef<RTCPeerConnection | null>(null);
  const dataChannelRef = useRef<RTCDataChannel | null>(null);
  const sessionIdRef = useRef<string | null>(null);
  const pendingCandidatesRef = useRef<IceCandidatePayload[]>([]);

  // Check API connection on mount
  useEffect(() => {
    async function checkConnection() {
      setIsLoading(true);
      try {
        const client = getScopeClient();
        const health = await client.checkHealth();
        const connected = health.status === "ok";
        onConnectionChange(connected);
        if (!connected) {
          setError("Could not connect to Scope API. Check if RunPod instance is running.");
        } else {
          setError(null);
        }
      } catch (err) {
        console.error("[AvatarStudio] Connection check failed:", err);
        onConnectionChange(false);
        setError("Failed to connect to Scope API");
      } finally {
        setIsLoading(false);
      }
    }
    checkConnection();
  }, [onConnectionChange]);

  const cleanupConnection = useCallback(() => {
    if (peerConnectionRef.current) {
      peerConnectionRef.current.onicecandidate = null;
      peerConnectionRef.current.ontrack = null;
      peerConnectionRef.current.onconnectionstatechange = null;
      peerConnectionRef.current.close();
      peerConnectionRef.current = null;
    }

    if (outputStreamRef.current) {
      outputStreamRef.current.getTracks().forEach((track) => track.stop());
      outputStreamRef.current = null;
    }

    dataChannelRef.current = null;
    sessionIdRef.current = null;
    pendingCandidatesRef.current = [];
    setOutputStream(null);
  }, []);

  useEffect(() => {
    return () => {
      cleanupConnection();
    };
  }, [cleanupConnection]);

  const buildInitialParameters = useCallback(() => {
    const parameters: Record<string, unknown> = {
      prompts: [{ text: prompt, weight: 1.0 }],
      denoising_step_list: [1000, 750, 500, 250],
      manage_cache: true,
    };

    const hasServerAsset =
      referenceImage.startsWith("/assets/") || referenceImage.startsWith("assets/");

    if (hasServerAsset) {
      parameters.vace_ref_images = [referenceImage];
      parameters.vace_context_scale = vaceScale;
    }

    return parameters;
  }, [prompt, referenceImage, vaceScale]);

  const handleStartStream = useCallback(async () => {
    setIsStreaming(true);
    setError(null);

    try {
      const client = getScopeClient();

      const pipelineLoaded = await client.loadPipeline("longlive");
      if (!pipelineLoaded) {
        throw new Error("Failed to load longlive pipeline");
      }

      let pipelineReady = false;
      for (let attempt = 0; attempt < 30; attempt += 1) {
        const status = await client.getPipelineStatus();
        if (status?.status === "loaded") {
          pipelineReady = true;
          break;
        }
        if (status?.status === "error") {
          throw new Error(status.error || "Pipeline failed to load");
        }
        await new Promise((resolve) => setTimeout(resolve, 1000));
      }

      if (!pipelineReady) {
        throw new Error("Pipeline load timed out");
      }

      const iceServers = await client.getIceServers();
      if (!iceServers) {
        throw new Error("Failed to fetch ICE servers");
      }

      const pc = new RTCPeerConnection({ iceServers: iceServers.iceServers });
      peerConnectionRef.current = pc;

      pc.addTransceiver("video");

      pc.ontrack = (event) => {
        if (event.streams && event.streams[0]) {
          outputStreamRef.current = event.streams[0];
          setOutputStream(event.streams[0]);
        }
      };

      pc.onconnectionstatechange = () => {
        if (pc.connectionState === "failed" || pc.connectionState === "disconnected") {
          setError("WebRTC connection failed");
          setIsStreaming(false);
          cleanupConnection();
        }
      };

      pc.onicecandidate = async (event) => {
        if (!event.candidate) return;

        const payload = {
          candidate: event.candidate.candidate,
          sdpMid: event.candidate.sdpMid,
          sdpMLineIndex: event.candidate.sdpMLineIndex,
        };

        if (sessionIdRef.current) {
          await client.addIceCandidates(sessionIdRef.current, [payload]);
        } else {
          pendingCandidatesRef.current.push(payload);
        }
      };

      dataChannelRef.current = pc.createDataChannel("parameters", { ordered: true });
      dataChannelRef.current.onmessage = (event) => {
        try {
          const message = JSON.parse(event.data);
          if (message.type === "stream_stopped") {
            setError(message.error_message || "Scope stream stopped");
            setIsStreaming(false);
            cleanupConnection();
          }
        } catch (parseError) {
          console.warn("[AvatarStudio] Unhandled data channel message:", parseError);
        }
      };

      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);

      const response = await client.createWebRtcOffer({
        sdp: offer.sdp || "",
        type: offer.type,
        initialParameters: buildInitialParameters(),
      });

      if (!response) {
        throw new Error("Failed to establish WebRTC session");
      }

      sessionIdRef.current = response.sessionId;
      await pc.setRemoteDescription({ type: response.type, sdp: response.sdp });

      if (pendingCandidatesRef.current.length > 0) {
        await client.addIceCandidates(sessionIdRef.current, pendingCandidatesRef.current);
        pendingCandidatesRef.current = [];
      }
    } catch (err) {
      console.error("[AvatarStudio] Stream start failed:", err);
      setError(err instanceof Error ? err.message : "Failed to start stream");
      setIsStreaming(false);
      cleanupConnection();
    }
  }, [buildInitialParameters, cleanupConnection]);

  const handleStopStream = useCallback(() => {
    setIsStreaming(false);
    cleanupConnection();
  }, [cleanupConnection]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-400">Connecting to Scope API...</div>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Left Column: Input */}
      <div className="space-y-4">
        <div className="bg-scope-surface rounded-lg p-4">
          <h2 className="text-lg font-semibold mb-4">Input</h2>

          {/* Webcam Preview */}
          <WebcamPreview />
        </div>

        {/* Reference Image */}
        <div className="bg-scope-surface rounded-lg p-4">
          <h2 className="text-lg font-semibold mb-4">Reference Image (VACE)</h2>
          <ReferenceImage
            src={referenceImage}
            onImageChange={setReferenceImage}
          />

          {/* VACE Scale */}
          <div className="mt-4">
            <label className="block text-sm text-gray-400 mb-2">
              VACE Scale: {vaceScale.toFixed(2)}
            </label>
            <input
              type="range"
              min="0"
              max="2"
              step="0.1"
              value={vaceScale}
              onChange={(e) => setVaceScale(parseFloat(e.target.value))}
              className="w-full"
            />
            <p className="text-xs text-gray-500 mt-1">
              Higher = stronger identity preservation (recommended: 1.5-2.0)
            </p>
          </div>
        </div>
      </div>

      {/* Center Column: Output */}
      <div className="bg-scope-surface rounded-lg p-4">
        <h2 className="text-lg font-semibold mb-4">Output</h2>

        {error && (
          <div className="mb-4 p-3 bg-scope-error/20 border border-scope-error rounded-lg text-sm">
            {error}
          </div>
        )}

        <OutputPreview isStreaming={isStreaming} stream={outputStream} />

        {/* Stream Controls */}
        <div className="mt-4 flex gap-2">
          {!isStreaming ? (
            <button
              onClick={handleStartStream}
              disabled={!!error}
              className="flex-1 py-3 bg-scope-accent hover:bg-scope-accent/80 disabled:bg-gray-600 disabled:cursor-not-allowed rounded-lg font-medium transition-colors"
            >
              Start Generation
            </button>
          ) : (
            <button
              onClick={handleStopStream}
              className="flex-1 py-3 bg-scope-error hover:bg-scope-error/80 rounded-lg font-medium transition-colors"
            >
              Stop
            </button>
          )}
        </div>
      </div>

      {/* Right Column: Controls */}
      <div className="space-y-4">
        <div className="bg-scope-surface rounded-lg p-4">
          <h2 className="text-lg font-semibold mb-4">Prompt</h2>
          <PromptEditor
            value={prompt}
            onChange={setPrompt}
            styleModifiers={DEFAULT_AVATAR_CONFIG.styleModifiers}
          />
        </div>

        {/* Quick Info */}
        <div className="bg-scope-surface rounded-lg p-4">
          <h2 className="text-lg font-semibold mb-4">Settings</h2>
          <div className="space-y-2 text-sm text-gray-400">
            <div className="flex justify-between">
              <span>Resolution</span>
              <span>{DEFAULT_GENERATION_PARAMS.width}×{DEFAULT_GENERATION_PARAMS.height}</span>
            </div>
            <div className="flex justify-between">
              <span>Steps</span>
              <span>{DEFAULT_GENERATION_PARAMS.numInferenceSteps}</span>
            </div>
            <div className="flex justify-between">
              <span>Guidance</span>
              <span>{DEFAULT_GENERATION_PARAMS.guidanceScale}</span>
            </div>
            <div className="flex justify-between">
              <span>Seed</span>
              <span>{DEFAULT_GENERATION_PARAMS.seed}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
