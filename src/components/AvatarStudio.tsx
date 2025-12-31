"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { getScopeClient, createScopeWebRtcSession, prepareScopePipeline } from "@/lib/scope";
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

        const hasServerAsset =
          referenceImage.startsWith("/assets/") || referenceImage.startsWith("assets/");

        await prepareScopePipeline({
          scopeClient: client,
          pipelineId: DEFAULT_PIPELINE,
          loadParams: {
            width: DEFAULT_GENERATION_PARAMS.width,
            height: DEFAULT_GENERATION_PARAMS.height,
            vace_enabled: hasServerAsset,
          },
          onStatus: setConnectionStatus,
        });

        setConnectionStatus("Creating WebRTC connection...");
        const { pc, dataChannel } = await createScopeWebRtcSession({
          scopeClient: client,
          initialParameters: buildInitialParameters(),
          setupPeerConnection: (connection) => {
            peerConnectionRef.current = connection;
            videoTracks.forEach((track) => {
              connection.addTrack(track, inputStream);
            });
          },
          onTrack: (event) => {
            if (event.streams && event.streams[0]) {
              outputStreamRef.current = event.streams[0];
              setOutputStream(event.streams[0]);
              setConnectionStatus("Connected - Receiving video");
            }
          },
          onConnectionStateChange: (connection) => {
            if (connection.connectionState === "failed" || connection.connectionState === "disconnected") {
              handleConnectionLost("WebRTC connection lost");
            }
          },
          dataChannel: {
            label: "parameters",
            options: { ordered: true },
            onOpen: () => {
              setConnectionStatus("Connected - Parameters ready");
            },
            onClose: () => {
              handleConnectionLost("Data channel closed");
            },
            onMessage: (event) => {
              try {
                const message = JSON.parse(event.data);
                if (message.type === "stream_stopped") {
                  handleConnectionLost(message.error_message || "Scope stream stopped");
                }
              } catch (parseError) {
                console.warn("[AvatarStudio] Unhandled data channel message:", parseError);
              }
            },
          },
        });

        peerConnectionRef.current = pc;
        dataChannelRef.current = dataChannel ?? null;
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

            {error && (
              <div className="absolute top-4 inset-x-4 z-30 p-4 glass-radiant bg-red-950/40 border-red-500/30 rounded-2xl animate-bounce-subtle">
                <p className="text-red-200 text-[10px] font-black uppercase tracking-[0.2em]">{error}</p>
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
