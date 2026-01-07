"use client";

import { useState, useEffect, useCallback, useRef, useMemo } from "react";
import { getScopeClient, useScopeConnection } from "@/lib/scope";
import { DEFAULT_AVATAR_CONFIG, DEFAULT_GENERATION_PARAMS } from "@/lib/scope/types";
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
  const [localError, setLocalError] = useState<string | null>(null);
  const [connectionStatus, setConnectionStatus] = useState<string>("");
  const [prompt, setPrompt] = useState(DEFAULT_AVATAR_CONFIG.promptTemplate);
  const [vaceScale, setVaceScale] = useState(DEFAULT_AVATAR_CONFIG.vaceScale);
  const [referenceImage, setReferenceImage] = useState<string>("/metadj-avatar-reference.png");
  const [webcamStream, setWebcamStream] = useState<MediaStream | null>(null);
  const [outputStream, setOutputStream] = useState<MediaStream | null>(null);
  const outputStreamRef = useRef<MediaStream | null>(null);
  const webcamStreamRef = useRef<MediaStream | null>(null);

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
          setLocalError("Could not connect to Scope API. Check if RunPod instance is running.");
          setConnectionStatus("Scope API unavailable");
        } else {
          setLocalError(null);
          setConnectionStatus("Scope API ready");
        }
      } catch (err) {
        console.error("[AvatarStudio] Connection check failed:", err);
        setLocalError("Failed to connect to Scope API");
        setConnectionStatus("Scope API unavailable");
      } finally {
        setIsLoading(false);
      }
    }
    checkConnection();
  }, []);

  const hasServerAsset = useMemo(
    () => referenceImage.startsWith("/assets/") || referenceImage.startsWith("assets/"),
    [referenceImage]
  );

  const loadParams = useMemo(
    () => ({
      width: DEFAULT_GENERATION_PARAMS.width,
      height: DEFAULT_GENERATION_PARAMS.height,
      vace_enabled: hasServerAsset,
    }),
    [hasServerAsset]
  );

  const baseParameters = useMemo(() => {
    const parameters: Record<string, unknown> = {
      input_mode: "video",
      prompts: [{ text: prompt, weight: 1.0 }],
      denoising_step_list: [1000, 750, 500, 250],
      manage_cache: true,
      paused: false,
    };

    if (hasServerAsset) {
      parameters.vace_ref_images = [referenceImage];
      parameters.vace_context_scale = vaceScale;
    }

    return parameters;
  }, [prompt, referenceImage, vaceScale, hasServerAsset]);

  const setupPeerConnection = useCallback((connection: RTCPeerConnection) => {
    const inputStream = webcamStreamRef.current;
    if (!inputStream) {
      throw new Error("Start the webcam before starting the stream.");
    }

    const videoTracks = inputStream.getVideoTracks();
    if (videoTracks.length === 0) {
      throw new Error("No webcam video track available.");
    }

    videoTracks.forEach((track) => {
      connection.addTrack(track, inputStream);
    });
  }, []);

  const shouldReconnect = useCallback((_reason: string) => {
    void _reason;
    if (!webcamStreamRef.current) {
      setLocalError("Webcam inactive. Start the webcam to reconnect.");
      setConnectionStatus("Webcam required");
      return false;
    }
    return true;
  }, []);

  const {
    connectionState,
    statusMessage,
    error: scopeError,
    dataChannel,
    disconnect,
    retry,
    clearError,
  } = useScopeConnection({
    scopeClient: getScopeClient(),
    pipelineId: DEFAULT_PIPELINE,
    loadParams,
    initialParameters: baseParameters,
    maxReconnectAttempts: MAX_RECONNECT_ATTEMPTS,
    reconnectBaseDelay: RECONNECT_BASE_DELAY_MS,
    setupPeerConnection,
    onStream: (stream) => {
      outputStreamRef.current = stream;
      setOutputStream(stream);
    },
    onDataChannelOpen: () => {
      setConnectionStatus("Connected - Parameters ready");
    },
    onDataChannelClose: () => {
      setConnectionStatus("Parameters unavailable");
    },
    reconnectOnDataChannelClose: true,
    reconnectOnStreamStopped: true,
    shouldReconnect,
  });

  const isConnecting = connectionState === "connecting" || connectionState === "reconnecting";
  const isStreaming = connectionState === "connected";
  const errorMessage = localError ?? scopeError?.message ?? null;

  useEffect(() => {
    if (statusMessage) {
      setConnectionStatus(statusMessage);
    }
  }, [statusMessage]);

  useEffect(() => {
    onConnectionChange(isStreaming);
  }, [isStreaming, onConnectionChange]);

  useEffect(() => {
    if (connectionState !== "connected") {
      if (outputStreamRef.current) {
        outputStreamRef.current.getTracks().forEach((track) => track.stop());
        outputStreamRef.current = null;
      }
      setOutputStream(null);
    }
  }, [connectionState]);

  useEffect(() => {
    return () => {
      if (outputStreamRef.current) {
        outputStreamRef.current.getTracks().forEach((track) => track.stop());
        outputStreamRef.current = null;
      }
    };
  }, []);

  const handleWebcamReady = useCallback((stream: MediaStream) => {
    webcamStreamRef.current = stream;
    setWebcamStream(stream);
  }, []);

  const handleWebcamStop = useCallback(() => {
    webcamStreamRef.current = null;
    setWebcamStream(null);
    if (connectionState !== "disconnected") {
      disconnect();
      setConnectionStatus("Webcam stopped");
    }
  }, [connectionState, disconnect]);

  const handleClearErrors = useCallback(() => {
    setLocalError(null);
    clearError();
  }, [clearError]);

  const sendParameters = useCallback(
    (options?: { resetCache?: boolean }) => {
      if (!dataChannel || dataChannel.readyState !== "open") {
        setLocalError("Parameter channel not ready. Start the stream first.");
        setConnectionStatus("Parameters unavailable");
        return false;
      }

      const payload: Record<string, unknown> = { ...baseParameters };
      if (options?.resetCache) {
        payload.reset_cache = true;
      }

      try {
        dataChannel.send(JSON.stringify(payload));
        setLocalError(null);
        setConnectionStatus("Parameters updated");
        return true;
      } catch (sendError) {
        console.error("[AvatarStudio] Failed to send parameters:", sendError);
        setLocalError("Failed to send parameters to Scope");
        setConnectionStatus("Parameter update failed");
        return false;
      }
    },
    [baseParameters, dataChannel]
  );

  const handleApplyChanges = useCallback(() => {
    sendParameters({ resetCache: true });
  }, [sendParameters]);

  const handleStartStream = useCallback(() => {
    if (isConnecting || isStreaming) {
      return;
    }

    const inputStream = webcamStreamRef.current;
    if (!inputStream) {
      setLocalError("Start the webcam before starting the stream.");
      setConnectionStatus("Webcam required");
      return;
    }

    const videoTracks = inputStream.getVideoTracks();
    if (videoTracks.length === 0) {
      setLocalError("No webcam video track available.");
      setConnectionStatus("Webcam required");
      return;
    }

    handleClearErrors();
    retry();
  }, [handleClearErrors, isConnecting, isStreaming, retry]);

  const handleStopStream = useCallback(() => {
    disconnect();
    setConnectionStatus("Disconnected");
    handleClearErrors();
  }, [disconnect, handleClearErrors]);

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center h-96 relative overflow-hidden">
        <div className="text-white/20 text-7xl mb-8 animate-pulse text-pop grayscale">🎭</div>
        <div className="text-white/40 text-[10px] font-black uppercase tracking-[0.6em] animate-pulse">Synchronizing Neural Workspace...</div>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
      {/* Left Column: Input (Video & Identity) */}
      <div className="lg:col-span-1 space-y-8">
        <div className="glass rounded-[2.5rem] p-8 border-white/5 shadow-2xl relative overflow-hidden group interactive-scale">
          <div className="absolute inset-0 bg-scope-purple/5 opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none" />

          <h2 className="text-xs font-black uppercase tracking-[0.4em] text-white/30 mb-8 flex items-center gap-3">
            <span className="w-2 h-2 rounded-full bg-scope-purple animate-pulse" />
            Neural Ingest
          </h2>

          {/* Webcam Preview */}
          <WebcamPreview
            onStreamReady={handleWebcamReady}
            onStreamStop={handleWebcamStop}
            preferredWidth={DEFAULT_GENERATION_PARAMS.width ?? 512}
            preferredHeight={DEFAULT_GENERATION_PARAMS.height ?? 512}
            preferredFrameRate={15}
          />
          <div className="mt-6 flex items-center justify-between px-2">
            <span className="text-[10px] font-black uppercase tracking-widest text-white/20">Protocol: Video-to-Video</span>
            <span className={`text-[10px] font-bold ${webcamStream ? 'text-scope-purple' : 'text-white/10'}`}>
              {webcamStream ? "LOCKED" : "STNBY"}
            </span>
          </div>
        </div>

        {/* Reference Image */}
        <div className="glass rounded-[2.5rem] p-8 border-white/5 shadow-2xl relative overflow-hidden group interactive-scale">
          <div className="absolute inset-0 bg-scope-magenta/5 opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none" />

          <h2 className="text-xs font-black uppercase tracking-[0.4em] text-white/30 mb-8 flex items-center gap-3">
            <span className="w-2 h-2 rounded-full bg-scope-magenta" />
            VACE Parameter
          </h2>
          <ReferenceImage
            src={referenceImage}
            onImageChange={setReferenceImage}
          />

          {/* VACE Scale */}
          <div className="mt-8 space-y-4">
            <div className="flex justify-between items-center text-[10px] font-black uppercase tracking-widest">
              <span className="text-white/40">Identity Lock</span>
              <span className="text-scope-magenta text-pop">{vaceScale.toFixed(2)}x</span>
            </div>
            <div className="relative h-2">
              <input
                type="range"
                min="0"
                max="2"
                step="0.1"
                value={vaceScale}
                onChange={(e) => setVaceScale(parseFloat(e.target.value))}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
              />
              <div className="absolute inset-0 bg-white/5 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-scope-purple to-scope-magenta rounded-full"
                  style={{ width: `${(vaceScale / 2) * 100}%` }}
                />
              </div>
            </div>
            <p className="text-[9px] font-bold text-white/20 uppercase tracking-[0.2em] leading-relaxed">
              Elevated values optimize character consistency across frames.
            </p>
          </div>
        </div>
      </div>

      {/* Center Column: Output (Visual Projection) */}
      <div className="lg:col-span-2">
        <section className="glass-radiant rounded-[3.5rem] p-10 border-white/10 shadow-[0_0_80px_rgba(168,85,247,0.1)] h-full relative overflow-hidden">
          <div className="flex items-center justify-between mb-8 relative z-10">
            <div className="flex flex-col gap-1">
              <h2 className="text-xl font-bold text-white uppercase tracking-tighter text-pop">Avatar Projection</h2>
              <span className="text-[9px] font-black uppercase tracking-[0.3em] text-scope-purple opacity-60">Neural Workspace v2.0</span>
            </div>
            <div className="flex items-center gap-6">
              <div className={`px-4 py-1.5 rounded-full border text-[9px] font-black uppercase tracking-widest transition-all duration-500 ${isStreaming ? 'border-scope-magenta text-scope-magenta bg-scope-magenta/5 shadow-[0_0_15px_rgba(168,85,247,0.2)]' : 'border-white/5 text-white/20'}`}>
                {connectionStatus || "Standby"}
              </div>
            </div>
          </div>

          <div className="relative group overflow-hidden rounded-[2.5rem] border border-white/5 bg-black/60 shadow-inner">
            {/* Inner Depth Glow */}
            <div className="absolute inset-0 z-10 pointer-events-none shadow-[inset_0_0_120px_rgba(0,0,0,0.9)]" />

            {errorMessage && (
              <div className="absolute top-4 inset-x-4 z-30 p-4 glass-radiant bg-red-950/40 border-red-500/30 rounded-2xl animate-bounce-subtle" role="alert">
                <button
                  type="button"
                  onClick={handleClearErrors}
                  className="absolute top-2 right-2 p-1 text-red-300/60 hover:text-red-300 transition-colors"
                  aria-label="Dismiss error"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
                <p className="text-red-200 text-[10px] font-black uppercase tracking-[0.2em] pr-6">{errorMessage}</p>
              </div>
            )}

            <OutputPreview isStreaming={isStreaming} stream={outputStream} />
          </div>

          {/* Stream Controls */}
          <div className="mt-10 flex flex-col gap-6 relative z-10">
            <div className="flex gap-4">
              {!isStreaming ? (
                <button
                  type="button"
                  onClick={handleStartStream}
                  disabled={isConnecting || !webcamStream}
                  className="flex-1 py-5 glass-radiant rounded-full font-black uppercase tracking-[0.4em] text-[11px] text-white border-white/10 hover:border-scope-purple/40 hover:scale-[1.03] active:scale-95 transition-all duration-500 hover:shadow-[0_0_40px_rgba(168,85,247,0.3)] disabled:opacity-30 disabled:cursor-not-allowed"
                >
                  {isConnecting ? "Negotiating Bridge..." : "Initiate Neural Bridge"}
                </button>
              ) : (
                <button
                  type="button"
                  onClick={handleStopStream}
                  className="flex-1 py-5 glass-radiant bg-red-950/40 border-red-500/30 hover:bg-red-500/60 rounded-full font-black uppercase tracking-[0.4em] text-[11px] text-red-100 transition-all duration-500 hover:scale-[1.03] active:scale-95"
                >
                  Terminate Bridge
                </button>
              )}
            </div>

            <div className="flex justify-between items-center px-4">
              <div className="flex items-center gap-3">
                <div className={`w-1.5 h-1.5 rounded-full ${isStreaming ? 'bg-scope-magenta animate-pulse shadow-[0_0_8px_rgba(168,85,247,0.8)]' : 'bg-white/10'}`} />
                <span className="text-[9px] font-black uppercase tracking-[0.4em] text-white/20">Protocol: {isStreaming ? "Active Projection" : "Ready"}</span>
              </div>
              <span className="text-[9px] font-black uppercase tracking-[0.4em] text-white/20">
                Res: {DEFAULT_GENERATION_PARAMS.width}x{DEFAULT_GENERATION_PARAMS.height}
              </span>
            </div>
          </div>
        </section>
      </div>

      {/* Right Column: Controls (Prompt & Style) */}
      <div className="lg:col-span-1 space-y-8">
        <div className="glass rounded-[2.5rem] p-8 border-white/5 shadow-2xl relative overflow-hidden group interactive-scale">
          <div className="absolute inset-0 bg-white/5 opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none" />

          <h2 className="text-xs font-black uppercase tracking-[0.4em] text-white/30 mb-8 flex items-center gap-3">
            <span className="w-2 h-2 rounded-full bg-white/20" />
            Style Prompt
          </h2>
          <PromptEditor
            value={prompt}
            onChange={setPrompt}
            styleModifiers={DEFAULT_AVATAR_CONFIG.styleModifiers}
          />
          <div className="mt-8 pt-6 border-t border-white/5 flex flex-col gap-4">
            <button
              type="button"
              onClick={handleApplyChanges}
              disabled={!isStreaming || isConnecting}
              className="py-4 px-6 glass-radiant bg-scope-cyan/20 hover:bg-scope-cyan text-cyan-100 hover:text-black rounded-2xl text-[10px] font-black uppercase tracking-[0.4em] transition-all duration-500 disabled:opacity-20 disabled:grayscale"
            >
              Apply Updates
            </button>
            <p className="text-[9px] font-bold text-white/20 uppercase tracking-widest leading-relaxed text-center">
              Re-synchronize prompt and <br /> identity lock in real-time.
            </p>
          </div>
        </div>

        {/* Studio Diagnostics */}
        <div className="glass rounded-[2.5rem] p-8 border-white/5 relative overflow-hidden group interactive-scale">
          <div className="absolute inset-0 bg-scope-magenta/5 opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none" />

          <h2 className="text-xs font-black uppercase tracking-[0.4em] text-white/30 mb-8 flex items-center gap-3">
            <span className="w-2 h-2 rounded-full bg-scope-magenta/40" />
            Diagnostics
          </h2>
          <div className="space-y-4">
            {[
              { label: "Pipeline", value: "LONG-LIVE" },
              { label: "Steps", value: DEFAULT_GENERATION_PARAMS.numInferenceSteps },
              { label: "Guidance", value: DEFAULT_GENERATION_PARAMS.guidanceScale },
              { label: "Latents", value: "STABLE-FP16" }
            ].map((stat, i) => (
              <div key={i} className="flex justify-between items-center text-[10px] font-black uppercase tracking-widest">
                <span className="text-white/20">{stat.label}</span>
                <span className="text-white/60">{stat.value}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
