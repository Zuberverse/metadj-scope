/**
 * Soundscape Studio Component
 * Video-first layout with collapsible controls
 */

"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import { useSoundscape, DEFAULT_ASPECT_RATIO } from "@/lib/soundscape";
import type { AspectRatioConfig } from "@/lib/soundscape";
import { getScopeClient } from "@/lib/scope/client";
import { createScopeWebRtcSession, prepareScopePipeline } from "@/lib/scope";
import { AudioPlayer } from "./AudioPlayer";
import { ThemeSelector } from "./ThemeSelector";
import { AnalysisMeter } from "./AnalysisMeter";
import { AspectRatioToggle } from "./AspectRatioToggle";

// Default pipeline for Soundscape (longlive = stylized, smooth transitions)
const DEFAULT_PIPELINE = "longlive";

// Reconnection configuration
const MAX_RECONNECT_ATTEMPTS = 3;
const RECONNECT_DELAY_MS = 2000;

interface SoundscapeStudioProps {
  onConnectionChange?: (connected: boolean) => void;
}

export function SoundscapeStudio({ onConnectionChange }: SoundscapeStudioProps) {
  // Scope connection state
  const [isConnecting, setIsConnecting] = useState(false);
  const [scopeStream, setScopeStream] = useState<MediaStream | null>(null);
  const [scopeError, setScopeError] = useState<string | null>(null);
  const [connectionStatus, setConnectionStatus] = useState<string>("");
  const [reconnectAttempts, setReconnectAttempts] = useState(0);
  const reconnectTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const dataChannelRef = useRef<RTCDataChannel | null>(null);
  const peerConnectionRef = useRef<RTCPeerConnection | null>(null);

  // UI state
  const [showControls, setShowControls] = useState(true);

  // Aspect ratio state (16:9 widescreen by default)
  const [aspectRatio, setAspectRatio] = useState<AspectRatioConfig>(DEFAULT_ASPECT_RATIO);

  // Soundscape hook
  const {
    state,
    parameters,
    presetThemes,
    connectAudio,
    disconnectAudio,
    setDataChannel,
    start,
    stop,
    setTheme,
    currentTheme,
    startAmbient,
    stopAmbient,
  } = useSoundscape({
    initialTheme: "cosmic-voyage",
    debug: process.env.NODE_ENV === "development",
  });

  // Track if audio is ready
  const [audioReady, setAudioReady] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);

  // Handle audio element connection
  const handleAudioElement = useCallback(
    async (element: HTMLAudioElement | null) => {
      if (element) {
        try {
          await connectAudio(element);
          setAudioReady(true);
        } catch (error) {
          console.error("Failed to connect audio:", error);
        }
      } else {
        disconnectAudio();
        setAudioReady(false);
      }
    },
    [connectAudio, disconnectAudio]
  );

  // Handle play state changes
  const handlePlayStateChange = useCallback(
    (playing: boolean) => {
      setIsPlaying(playing);
      if (playing && audioReady) {
        stopAmbient();
        start();
      } else {
        stop();
        if (scopeStream) {
          startAmbient();
        }
      }
    },
    [audioReady, start, stop, startAmbient, stopAmbient, scopeStream]
  );

  // Connect video stream to element
  useEffect(() => {
    if (videoRef.current && scopeStream) {
      videoRef.current.srcObject = scopeStream;
      videoRef.current.play().catch((err) => {
        console.warn("[Soundscape] Video autoplay blocked:", err.message);
      });
    }
  }, [scopeStream]);

  // Notify parent of connection changes
  useEffect(() => {
    onConnectionChange?.(!!scopeStream);
  }, [scopeStream, onConnectionChange]);

  // Cleanup WebRTC on unmount
  useEffect(() => {
    return () => {
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
      if (dataChannelRef.current) {
        dataChannelRef.current.close();
      }
      if (peerConnectionRef.current) {
        peerConnectionRef.current.close();
      }
    };
  }, []);

  // Disconnect from Scope
  const handleDisconnectScope = useCallback((userInitiated = false) => {
    stopAmbient();
    setDataChannel(null);

    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }

    if (dataChannelRef.current) {
      dataChannelRef.current.close();
      dataChannelRef.current = null;
    }

    if (peerConnectionRef.current) {
      peerConnectionRef.current.close();
      peerConnectionRef.current = null;
    }

    setScopeStream(null);
    setConnectionStatus("");

    if (userInitiated) {
      setReconnectAttempts(0);
      setScopeError(null);
    }

    console.log("[Soundscape] Disconnected from Scope", userInitiated ? "(user)" : "(connection lost)");
  }, [setDataChannel, stopAmbient]);

  // Connect to Scope with full WebRTC flow
  const handleConnectScope = useCallback(async () => {
    setIsConnecting(true);
    setScopeError(null);
    setConnectionStatus("Initializing...");

    const scopeClient = getScopeClient();
    console.log("[Soundscape] Connecting to Scope at:", scopeClient.getBaseUrl());

    try {
      // Step 1: Health check
      setConnectionStatus("Checking server...");
      const health = await scopeClient.checkHealth();
      if (health.status !== "ok") {
        throw new Error("Scope server is not healthy. Is the pod running?");
      }

      // Only pass vace_enabled for longlive (other pipelines may not accept it)
      const loadParams: Record<string, unknown> = {
        width: aspectRatio.resolution.width,
        height: aspectRatio.resolution.height,
      };
      if (DEFAULT_PIPELINE === "longlive") {
        loadParams.vace_enabled = false;
      }
      await prepareScopePipeline({
        scopeClient,
        pipelineId: DEFAULT_PIPELINE,
        loadParams,
        onStatus: setConnectionStatus,
      });

      setConnectionStatus("Creating connection...");
      // Fixed 3-step schedule for good quality/FPS balance (~20-25 fps on RTX 6000)
      const DENOISING_STEPS = [1000, 750, 500, 250];
      const initialParams = currentTheme
        ? {
          prompts: [{ text: currentTheme.basePrompt, weight: 1.0 }],
          noise_scale: currentTheme.ranges.noiseScale.min,
          denoising_step_list: DENOISING_STEPS,
          manage_cache: true,
          paused: false,
        }
        : undefined;

      const { pc, dataChannel } = await createScopeWebRtcSession({
        scopeClient,
        initialParameters: initialParams,
        setupPeerConnection: (connection) => {
          peerConnectionRef.current = connection;
          connection.addTransceiver("video");
        },
        onTrack: (event) => {
          if (event.track.kind === "video" && event.streams[0]) {
            setScopeStream(event.streams[0]);
            setConnectionStatus("Connected");
          }
        },
        onConnectionStateChange: (connection) => {
          if (connection.connectionState === "failed" || connection.connectionState === "disconnected") {
            setScopeError("Connection lost");
            handleDisconnectScope(false);
            setReconnectAttempts((prev) => {
              const newAttempts = prev + 1;
              if (newAttempts <= MAX_RECONNECT_ATTEMPTS) {
                setConnectionStatus(`Reconnecting (${newAttempts}/${MAX_RECONNECT_ATTEMPTS})...`);
                reconnectTimeoutRef.current = setTimeout(() => {
                  handleConnectScope();
                }, RECONNECT_DELAY_MS * newAttempts);
              } else {
                setScopeError("Connection failed. Click Retry.");
              }
              return newAttempts;
            });
          }
        },
        dataChannel: {
          label: "parameters",
          options: { ordered: true },
          onOpen: (channel) => {
            dataChannelRef.current = channel;
            setDataChannel(channel);
            if (!isPlaying) {
              startAmbient();
            }
          },
          onMessage: (event) => {
            try {
              const message = JSON.parse(event.data);
              if (message?.type === "stream_stopped") {
                setScopeError(message.error_message || "Stream stopped");
                handleDisconnectScope(false);
              }
            } catch {
              // ignore parse errors
            }
          },
          onClose: () => {
            dataChannelRef.current = null;
            setDataChannel(null);
            stopAmbient();
          },
        },
      });

      peerConnectionRef.current = pc;
      dataChannelRef.current = dataChannel ?? null;
      setConnectionStatus("Connected");
      setReconnectAttempts(0);
      setScopeError(null);

      if (process.env.NODE_ENV === "development") {
        (window as unknown as { debugPeerConnection: RTCPeerConnection }).debugPeerConnection = pc;
      }

    } catch (error) {
      const message = error instanceof Error ? error.message : "Connection failed";
      setScopeError(message);
      handleDisconnectScope();
    } finally {
      setIsConnecting(false);
    }
  }, [aspectRatio, currentTheme, setDataChannel, handleDisconnectScope, isPlaying, startAmbient]);

  return (
    <div className="h-full flex flex-col">
      {/* VIDEO HERO - Takes most of the space */}
      <div className="flex-1 min-h-0 relative bg-black">
        {scopeStream ? (
          <video
            ref={videoRef}
            autoPlay
            playsInline
            muted
            className="absolute inset-0 w-full h-full object-contain"
          />
        ) : isConnecting ? (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-center">
              <div className="text-4xl mb-4 animate-pulse">✨</div>
              <p className="text-scope-cyan text-sm font-medium mb-2">
                {connectionStatus || "Connecting..."}
              </p>
              <div className="w-32 h-1 bg-white/10 rounded-full mx-auto overflow-hidden">
                <div className="h-full bg-scope-cyan animate-pulse rounded-full w-2/3" />
              </div>
            </div>
          </div>
        ) : (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-center max-w-md px-4">
              <div className="text-6xl mb-6 opacity-30">✨</div>
              <p className="text-gray-400 mb-6">
                Connect to generate real-time AI visuals from your audio
              </p>
              <button
                type="button"
                onClick={handleConnectScope}
                className="px-8 py-3 bg-scope-cyan/20 hover:bg-scope-cyan/30 text-scope-cyan border border-scope-cyan/30 rounded-lg font-medium transition-all hover:scale-105"
              >
                Connect to Scope
              </button>
              {scopeError && (
                <div className="mt-4">
                  <p className="text-red-400 text-sm mb-2">{scopeError}</p>
                  {reconnectAttempts >= MAX_RECONNECT_ATTEMPTS && (
                    <button
                      type="button"
                      onClick={() => {
                        setReconnectAttempts(0);
                        setScopeError(null);
                        handleConnectScope();
                      }}
                      className="text-sm text-scope-cyan hover:underline"
                    >
                      Retry
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Overlay controls - Top Right */}
        {scopeStream && (
          <div className="absolute top-3 right-3 flex items-center gap-2">
            <AspectRatioToggle
              current={aspectRatio}
              onChange={setAspectRatio}
              disabled={!!scopeStream}
            />
            <button
              type="button"
              onClick={() => handleDisconnectScope(true)}
              className="px-3 py-1.5 bg-red-500/20 hover:bg-red-500/40 text-red-300 text-xs rounded border border-red-500/30 transition-colors"
            >
              Disconnect
            </button>
          </div>
        )}

        {/* Toggle Controls Button */}
        <button
          type="button"
          onClick={() => setShowControls(!showControls)}
          className="absolute bottom-3 right-3 px-3 py-1.5 bg-white/10 hover:bg-white/20 text-white/70 text-xs rounded backdrop-blur-sm transition-colors"
        >
          {showControls ? "Hide Controls" : "Show Controls"}
        </button>
      </div>

      {/* COMPACT CONTROLS DOCK - Bottom */}
      {showControls && (
        <div className="flex-none border-t border-white/10 bg-scope-surface/95 backdrop-blur-sm">
          <div className="flex items-stretch divide-x divide-white/10">
            {/* Audio Source */}
            <div className="flex-1 p-3">
              <div className="text-[10px] uppercase tracking-wider text-gray-500 mb-2">Audio</div>
              <AudioPlayer
                onAudioElement={handleAudioElement}
                onPlayStateChange={handlePlayStateChange}
                compact
              />
            </div>

            {/* Theme Selector */}
            <div className="flex-1 p-3">
              <div className="text-[10px] uppercase tracking-wider text-gray-500 mb-2">Theme</div>
              <ThemeSelector
                themes={presetThemes}
                currentTheme={currentTheme}
                onThemeChange={setTheme}
                compact
              />
            </div>

            {/* Analysis */}
            <div className="flex-1 p-3">
              <div className="text-[10px] uppercase tracking-wider text-gray-500 mb-2">Analysis</div>
              <AnalysisMeter analysis={state.analysis} parameters={parameters} compact />
            </div>

            {/* Status */}
            <div className="w-32 p-3 flex flex-col justify-center">
              <div className="text-[10px] uppercase tracking-wider text-gray-500 mb-1">Status</div>
              <div className="flex items-center gap-2">
                <div className={`w-2 h-2 rounded-full ${scopeStream ? "bg-green-500" : "bg-gray-600"}`} />
                <span className="text-xs text-gray-400">{scopeStream ? "Live" : "Offline"}</span>
              </div>
              <div className="flex items-center gap-2 mt-1">
                <div className={`w-2 h-2 rounded-full ${state.playback === "playing" ? "bg-scope-cyan animate-pulse" : "bg-gray-600"}`} />
                <span className="text-xs text-gray-400">{state.playback === "playing" ? "Active" : "Idle"}</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
