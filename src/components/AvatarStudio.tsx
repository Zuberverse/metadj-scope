"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { getScopeClient } from "@/lib/scope";
import { DEFAULT_AVATAR_CONFIG, DEFAULT_GENERATION_PARAMS, type IceCandidatePayload } from "@/lib/scope/types";
import { WebcamPreview } from "./WebcamPreview";
import { ReferenceImage } from "./ReferenceImage";
import { PromptEditor } from "./PromptEditor";
import { OutputPreview } from "./OutputPreview";

const DEFAULT_PIPELINE = "longlive";
const MAX_RECONNECT_ATTEMPTS = 3;
const RECONNECT_BASE_DELAY_MS = 2000;

interface AvatarStudioProps {
  onConnectionChange: (connected: boolean) => void;
}

export function AvatarStudio({ onConnectionChange }: AvatarStudioProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isConnecting, setIsConnecting] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<string>("");
  const [prompt, setPrompt] = useState(DEFAULT_AVATAR_CONFIG.promptTemplate);
  const [vaceScale, setVaceScale] = useState(DEFAULT_AVATAR_CONFIG.vaceScale);
  const [isStreaming, setIsStreaming] = useState(false);
  const [referenceImage, setReferenceImage] = useState<string>("/metadj-avatar-reference.png");
  const [webcamStream, setWebcamStream] = useState<MediaStream | null>(null);
  const [, setReconnectAttempts] = useState(0);
  const [outputStream, setOutputStream] = useState<MediaStream | null>(null);
  const outputStreamRef = useRef<MediaStream | null>(null);
  const webcamStreamRef = useRef<MediaStream | null>(null);
  const peerConnectionRef = useRef<RTCPeerConnection | null>(null);
  const dataChannelRef = useRef<RTCDataChannel | null>(null);
  const sessionIdRef = useRef<string | null>(null);
  const pendingCandidatesRef = useRef<IceCandidatePayload[]>([]);
  const reconnectTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const userInitiatedRef = useRef(false);
  const startStreamRef = useRef<((options?: { isReconnect?: boolean }) => void) | null>(null);

  // Check API connection on mount
  useEffect(() => {
    async function checkConnection() {
      setIsLoading(true);
      setConnectionStatus("Checking Scope server...");
      try {
        const client = getScopeClient();
        const health = await client.checkHealth();
        const connected = health.status === "ok";
        if (!connected) {
          setError("Could not connect to Scope API. Check if RunPod instance is running.");
          setConnectionStatus("Scope API unavailable");
        } else {
          setError(null);
          setConnectionStatus("Scope API ready");
        }
      } catch (err) {
        console.error("[AvatarStudio] Connection check failed:", err);
        setError("Failed to connect to Scope API");
        setConnectionStatus("Scope API unavailable");
      } finally {
        setIsLoading(false);
      }
    }
    checkConnection();
  }, []);

  const clearReconnectTimer = useCallback(() => {
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }
  }, []);

  const resetReconnect = useCallback(() => {
    clearReconnectTimer();
    setReconnectAttempts(0);
  }, [clearReconnectTimer]);

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
    setIsConnecting(false);
  }, []);

  useEffect(() => {
    return () => {
      clearReconnectTimer();
      cleanupConnection();
    };
  }, [cleanupConnection, clearReconnectTimer]);

  useEffect(() => {
    onConnectionChange(!!outputStream);
  }, [outputStream, onConnectionChange]);

  const handleWebcamReady = useCallback((stream: MediaStream) => {
    webcamStreamRef.current = stream;
    setWebcamStream(stream);
  }, []);

  const handleWebcamStop = useCallback(() => {
    webcamStreamRef.current = null;
    setWebcamStream(null);
  }, []);

  const buildInitialParameters = useCallback(() => {
    const parameters: Record<string, unknown> = {
      input_mode: "video",
      prompts: [{ text: prompt, weight: 1.0 }],
      denoising_step_list: [1000, 750, 500, 250],
      manage_cache: true,
      paused: false,
    };

    const hasServerAsset =
      referenceImage.startsWith("/assets/") || referenceImage.startsWith("assets/");

    if (hasServerAsset) {
      parameters.vace_ref_images = [referenceImage];
      parameters.vace_context_scale = vaceScale;
    }

    return parameters;
  }, [prompt, referenceImage, vaceScale]);

  const sendParameters = useCallback((options?: { resetCache?: boolean }) => {
    const channel = dataChannelRef.current;
    if (!channel || channel.readyState !== "open") {
      setError("Parameter channel not ready. Start the stream first.");
      setConnectionStatus("Parameters unavailable");
      return false;
    }

    const payload = buildInitialParameters();
    if (options?.resetCache) {
      payload.reset_cache = true;
    }

    try {
      channel.send(JSON.stringify(payload));
      setError(null);
      setConnectionStatus("Parameters updated");
      return true;
    } catch (sendError) {
      console.error("[AvatarStudio] Failed to send parameters:", sendError);
      setError("Failed to send parameters to Scope");
      setConnectionStatus("Parameter update failed");
      return false;
    }
  }, [buildInitialParameters]);

  const handleApplyChanges = useCallback(() => {
    sendParameters({ resetCache: true });
  }, [sendParameters]);

  const scheduleReconnect = useCallback(
    (reason: string) => {
      if (reconnectTimeoutRef.current) {
        return;
      }

      if (!webcamStreamRef.current) {
        setError("Webcam inactive. Start the webcam to reconnect.");
        setConnectionStatus("Webcam required");
        return;
      }

      setReconnectAttempts((prev) => {
        const next = prev + 1;
        if (next > MAX_RECONNECT_ATTEMPTS) {
          setError(`Connection lost (${reason}). Restart the stream.`);
          setConnectionStatus("Reconnection failed");
          return prev;
        }

        const delay = RECONNECT_BASE_DELAY_MS * next;
        const delaySeconds = Math.round(delay / 1000);
        setConnectionStatus(`Reconnecting (${next}/${MAX_RECONNECT_ATTEMPTS}) in ${delaySeconds}s...`);

        clearReconnectTimer();
        reconnectTimeoutRef.current = setTimeout(() => {
          startStreamRef.current?.({ isReconnect: true });
        }, delay);

        return next;
      });
    },
    [clearReconnectTimer]
  );

  const handleConnectionLost = useCallback(
    (reason: string) => {
      if (userInitiatedRef.current) {
        userInitiatedRef.current = false;
        return;
      }

      setError(reason);
      setIsStreaming(false);
      cleanupConnection();
      scheduleReconnect(reason);
    },
    [cleanupConnection, scheduleReconnect]
  );

  const startStream = useCallback(
    async (options?: { isReconnect?: boolean }) => {
      if (!options?.isReconnect && (isConnecting || isStreaming)) return;

      const inputStream = webcamStreamRef.current;
      if (!inputStream) {
        setError("Start the webcam before starting the stream.");
        setConnectionStatus("Webcam required");
        return;
      }

      const videoTracks = inputStream.getVideoTracks();
      if (videoTracks.length === 0) {
        setError("No webcam video track available.");
        setConnectionStatus("Webcam required");
        return;
      }

      userInitiatedRef.current = false;

      setIsConnecting(true);
      setIsStreaming(true);
      setError(null);
      setConnectionStatus(options?.isReconnect ? "Reconnecting..." : "Checking server health...");

      try {
        const client = getScopeClient();

        const health = await client.checkHealth();
        if (health.status !== "ok") {
          throw new Error("Scope server is not healthy. Is the pod running?");
        }

        const hasServerAsset =
          referenceImage.startsWith("/assets/") || referenceImage.startsWith("assets/");

        setConnectionStatus(`Loading ${DEFAULT_PIPELINE} pipeline...`);
        const pipelineLoaded = await client.loadPipeline(DEFAULT_PIPELINE, {
          width: DEFAULT_GENERATION_PARAMS.width,
          height: DEFAULT_GENERATION_PARAMS.height,
          vace_enabled: hasServerAsset,
        });
        if (!pipelineLoaded) {
          throw new Error(`Failed to load ${DEFAULT_PIPELINE} pipeline`);
        }

        setConnectionStatus("Waiting for pipeline...");
        const ready = await client.waitForPipelineLoaded();
        if (!ready) {
          throw new Error(`Pipeline failed to load: ${DEFAULT_PIPELINE}`);
        }

        setConnectionStatus("Fetching ICE servers...");
        const iceServers = await client.getIceServers();
        if (!iceServers) {
          throw new Error("Failed to fetch ICE servers");
        }

        setConnectionStatus("Creating WebRTC connection...");
        const pc = new RTCPeerConnection({ iceServers: iceServers.iceServers });
        peerConnectionRef.current = pc;

        videoTracks.forEach((track) => {
          pc.addTrack(track, inputStream);
        });

        pc.ontrack = (event) => {
          if (event.streams && event.streams[0]) {
            outputStreamRef.current = event.streams[0];
            setOutputStream(event.streams[0]);
            setConnectionStatus("Connected - Receiving video");
          }
        };

        pc.onconnectionstatechange = () => {
          if (pc.connectionState === "failed" || pc.connectionState === "disconnected") {
            handleConnectionLost("WebRTC connection lost");
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
        dataChannelRef.current.onopen = () => {
          setConnectionStatus("Connected - Parameters ready");
        };
        dataChannelRef.current.onclose = () => {
          handleConnectionLost("Data channel closed");
        };
        dataChannelRef.current.onmessage = (event) => {
          try {
            const message = JSON.parse(event.data);
            if (message.type === "stream_stopped") {
              handleConnectionLost(message.error_message || "Scope stream stopped");
            }
          } catch (parseError) {
            console.warn("[AvatarStudio] Unhandled data channel message:", parseError);
          }
        };

        const offer = await pc.createOffer();
        await pc.setLocalDescription(offer);

        setConnectionStatus("Exchanging SDP...");
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
        setConnectionStatus("Connected");
        resetReconnect();
      } catch (err) {
        console.error("[AvatarStudio] Stream start failed:", err);
        setError(err instanceof Error ? err.message : "Failed to start stream");
        setIsStreaming(false);
        cleanupConnection();
        scheduleReconnect(err instanceof Error ? err.message : "Connection failed");
        setConnectionStatus("Connection failed");
      } finally {
        setIsConnecting(false);
      }
    },
    [
      buildInitialParameters,
      cleanupConnection,
      handleConnectionLost,
      isConnecting,
      isStreaming,
      referenceImage,
      resetReconnect,
      scheduleReconnect,
    ]
  );

  const handleStartStream = useCallback(() => {
    resetReconnect();
    startStream({ isReconnect: false });
  }, [resetReconnect, startStream]);

  useEffect(() => {
    startStreamRef.current = startStream;
  }, [startStream]);

  const handleStopStream = useCallback(() => {
    userInitiatedRef.current = true;
    resetReconnect();
    setIsStreaming(false);
    cleanupConnection();
    setConnectionStatus("Disconnected");
  }, [cleanupConnection, resetReconnect]);

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
          <WebcamPreview
            onStreamReady={handleWebcamReady}
            onStreamStop={handleWebcamStop}
            preferredWidth={DEFAULT_GENERATION_PARAMS.width ?? 512}
            preferredHeight={DEFAULT_GENERATION_PARAMS.height ?? 512}
            preferredFrameRate={15}
          />
          <p className="mt-2 text-xs text-gray-500">
            Webcam: {webcamStream ? "Ready" : "Off"}
          </p>
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
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold">Output</h2>
          <span className="text-xs text-gray-500">
            {connectionStatus || "Idle"}
          </span>
        </div>

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
              type="button"
              onClick={handleStartStream}
              disabled={isConnecting || !webcamStream}
              className="flex-1 py-3 bg-scope-accent hover:bg-scope-accent/80 disabled:bg-gray-600 disabled:cursor-not-allowed rounded-lg font-medium transition-colors"
            >
              {isConnecting ? "Connecting..." : "Start Generation"}
            </button>
          ) : (
            <button
              type="button"
              onClick={handleStopStream}
              className="flex-1 py-3 bg-scope-error hover:bg-scope-error/80 rounded-lg font-medium transition-colors"
            >
              Stop
            </button>
          )}
        </div>
        {!webcamStream && (
          <p className="mt-2 text-xs text-gray-500">
            Start the webcam to enable generation.
          </p>
        )}

        <div className="mt-3 flex justify-between text-xs text-gray-500">
          <span>Status: {isStreaming ? "Running" : "Idle"}</span>
          <span>
            {DEFAULT_GENERATION_PARAMS.width}x{DEFAULT_GENERATION_PARAMS.height}
          </span>
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
          <div className="mt-4 flex flex-col gap-2">
            <button
              type="button"
              onClick={handleApplyChanges}
              disabled={!isStreaming || isConnecting}
              className="py-2 px-3 bg-scope-cyan text-black hover:bg-scope-cyan/80 disabled:bg-gray-700 disabled:text-gray-400 rounded text-sm font-medium transition-colors"
            >
              Apply Updates
            </button>
            <p className="text-xs text-gray-500">
              Sends prompt and VACE changes to the active stream.
            </p>
          </div>
        </div>

        {/* Quick Info */}
        <div className="bg-scope-surface rounded-lg p-4">
          <h2 className="text-lg font-semibold mb-4">Settings</h2>
          <div className="space-y-2 text-sm text-gray-400">
            <div className="flex justify-between">
              <span>Resolution</span>
              <span>{DEFAULT_GENERATION_PARAMS.width}x{DEFAULT_GENERATION_PARAMS.height}</span>
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
