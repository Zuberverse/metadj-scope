/**
 * Soundscape Studio Component
 * Video-first layout with collapsible controls
 */

"use client";

import { useState, useCallback, useRef, useEffect, useMemo } from "react";
import { useSoundscape, DEFAULT_ASPECT_RATIO } from "@/lib/soundscape";
import type { AspectRatioConfig } from "@/lib/soundscape";
import { getScopeClient, useScopeConnection } from "@/lib/scope";
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
  const [scopeStream, setScopeStream] = useState<MediaStream | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);

  // UI state
  const [showControls, setShowControls] = useState(true);
  const [sharpenEnabled, setSharpenEnabled] = useState(true); // Post-processing sharpening

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

  const loadParams = useMemo(() => {
    const params: Record<string, unknown> = {
      width: aspectRatio.resolution.width,
      height: aspectRatio.resolution.height,
    };
    if (DEFAULT_PIPELINE === "longlive") {
      params.vace_enabled = false;
    }
    return params;
  }, [aspectRatio]);

  const initialParameters = useMemo(() => {
    if (!currentTheme) return undefined;
    // 4-step schedule aligned with Scope examples (~15-20 fps on RTX 6000)
    const DENOISING_STEPS = [1000, 750, 500, 250];
    return {
      prompts: [{ text: currentTheme.basePrompt, weight: 1.0 }],
      noise_scale: currentTheme.ranges.noiseScale.min,
      denoising_step_list: DENOISING_STEPS,
      manage_cache: true,
      paused: false,
    };
  }, [currentTheme]);

  const handleScopeDisconnect = useCallback(() => {
    setScopeStream(null);
    setDataChannel(null);
    stopAmbient();
  }, [setDataChannel, stopAmbient]);

  const {
    connectionState,
    statusMessage,
    error,
    reconnectAttempts,
    peerConnection,
    connect,
    disconnect,
    retry,
    clearError,
  } = useScopeConnection({
    scopeClient: getScopeClient(),
    pipelineId: DEFAULT_PIPELINE,
    loadParams,
    initialParameters,
    maxReconnectAttempts: MAX_RECONNECT_ATTEMPTS,
    reconnectBaseDelay: RECONNECT_DELAY_MS,
    setupPeerConnection: (connection) => {
      connection.addTransceiver("video");
    },
    onStream: (stream) => {
      setScopeStream(stream);
    },
    onDataChannelOpen: (channel) => {
      setDataChannel(channel);
      if (!isPlaying) {
        startAmbient();
      }
    },
    onDataChannelClose: () => {
      setDataChannel(null);
      stopAmbient();
    },
    onDisconnect: handleScopeDisconnect,
    reconnectOnDataChannelClose: true,
    reconnectOnStreamStopped: true,
  });

  const isConnecting = connectionState === "connecting" || connectionState === "reconnecting";
  const scopeError = error?.message ?? null;

  useEffect(() => {
    if (process.env.NODE_ENV === "development" && peerConnection) {
      (window as unknown as { debugPeerConnection: RTCPeerConnection }).debugPeerConnection = peerConnection;
    }
  }, [peerConnection]);

  // Disconnect from Scope
  const handleDisconnectScope = useCallback((userInitiated = false) => {
    stopAmbient();
    setDataChannel(null);
    setScopeStream(null);
    disconnect(true);
    if (userInitiated) {
      clearError();
    }
    console.log("[Soundscape] Disconnected from Scope", userInitiated ? "(user)" : "(connection lost)");
  }, [clearError, disconnect, setDataChannel, stopAmbient]);

  const handleConnectScope = useCallback(() => {
    clearError();
    connect();
  }, [clearError, connect]);

  return (
    <div className="h-full flex flex-col">
      {/* VIDEO HERO - Takes most of the space with padding for controls */}
      <div className="flex-1 min-h-0 relative bg-black">
        {scopeStream ? (
          /* Video with padding so overlays don't cover content */
          <div className="absolute inset-0 p-3 pt-12 pb-12">
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              className="w-full h-full object-contain rounded-lg"
              style={sharpenEnabled ? {
                // CSS post-processing for crisper visuals
                filter: "contrast(1.08) saturate(1.05)",
                imageRendering: "crisp-edges",
              } : undefined}
            />
          </div>
        ) : isConnecting ? (
          <div className="absolute inset-0 flex items-center justify-center">
            {/* Ambient glow background */}
            <div className="glow-bg bg-scope-purple/20 top-1/4 left-1/4" />
            <div className="glow-bg bg-scope-cyan/15 bottom-1/4 right-1/4 animation-delay-2000" />
            <div className="glass-radiant text-center p-8 rounded-3xl max-w-sm">
              <div className="text-5xl mb-5 animate-float">✨</div>
              <h2 className="font-display text-xl text-white mb-2 tracking-wide">
                Initializing
              </h2>
              <p className="text-scope-cyan/80 text-sm font-medium mb-4">
                {statusMessage || "Connecting..."}
              </p>
              <div className="w-48 h-1.5 glass bg-white/5 rounded-full mx-auto overflow-hidden">
                <div className="h-full bg-gradient-to-r from-scope-purple via-scope-cyan to-scope-magenta animate-pulse rounded-full w-2/3" />
              </div>
            </div>
          </div>
        ) : (
          <div className="absolute inset-0 flex items-center justify-center">
            {/* Ambient glow background */}
            <div className="glow-bg bg-scope-purple/15 top-1/3 left-1/3" />
            <div className="glow-bg bg-scope-cyan/10 bottom-1/3 right-1/3 animation-delay-2000" />
            <div className="glass-radiant text-center max-w-md px-8 py-10 rounded-3xl">
              <div className="text-6xl mb-6 animate-float">✨</div>
              <h1 className="font-display text-2xl text-white mb-3 tracking-wide chisel-gradient">
                Soundscape
              </h1>
              <p className="text-white/50 mb-6 text-sm leading-relaxed">
                Generate real-time AI visuals from your audio with Daydream Scope
              </p>

              {/* Aspect Ratio Selection - must be set before connecting */}
              <div className="mb-6">
                <p className="text-[10px] text-white/30 uppercase tracking-widest mb-3">Output Format</p>
                <AspectRatioToggle
                  current={aspectRatio}
                  onChange={setAspectRatio}
                  disabled={false}
                />
              </div>

              <button
                type="button"
                onClick={() => handleConnectScope()}
                className="px-10 py-4 glass bg-scope-cyan/20 hover:bg-scope-cyan/30 text-scope-cyan border border-scope-cyan/40 rounded-2xl font-display text-sm uppercase tracking-[0.15em] transition-all duration-500 hover:scale-105 hover:shadow-[0_0_30px_rgba(6,182,212,0.3)]"
              >
                Connect to Scope
              </button>
              {scopeError && (
                <div className="mt-6 glass bg-red-500/10 border border-red-500/30 rounded-xl p-4 relative" role="alert">
                  {/* Dismiss button */}
                  <button
                    type="button"
                    onClick={clearError}
                    className="absolute top-2 right-2 p-1 text-red-400/60 hover:text-red-400 transition-colors"
                    aria-label="Dismiss error"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                  <p className="text-red-400 text-sm mb-2 pr-6">{scopeError}</p>
                  {reconnectAttempts >= MAX_RECONNECT_ATTEMPTS && (
                    <button
                      type="button"
                      onClick={retry}
                      className="text-sm text-scope-cyan hover:underline font-medium"
                    >
                      Retry Connection
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Overlay controls - Top Right (compact, single line) */}
        {scopeStream && (
          <div className="absolute top-3 right-3 flex items-center gap-1.5">
            <button
              type="button"
              onClick={() => setSharpenEnabled(!sharpenEnabled)}
              className={`px-2 py-1 text-[9px] font-medium uppercase tracking-wide rounded border transition-all duration-300 ${
                sharpenEnabled
                  ? "glass bg-scope-cyan/20 text-scope-cyan border-scope-cyan/40"
                  : "glass bg-white/5 text-white/50 border-white/10 hover:border-scope-cyan/30"
              }`}
              title="Toggle visual enhancement (contrast + saturation)"
            >
              {sharpenEnabled ? "Enhance" : "Raw"}
            </button>
            <button
              type="button"
              onClick={() => handleDisconnectScope(true)}
              className="px-2 py-1 glass bg-red-500/10 hover:bg-red-500/20 text-red-400 text-[9px] font-medium uppercase tracking-wide rounded border border-red-500/30 transition-all duration-300"
            >
              Disconnect
            </button>
          </div>
        )}

        {/* Toggle Controls Button */}
        <button
          type="button"
          onClick={() => setShowControls(!showControls)}
          className="absolute bottom-3 right-3 px-3 py-1.5 glass bg-white/5 hover:bg-white/10 text-white/60 hover:text-white/80 text-[9px] font-medium uppercase tracking-wide rounded border border-white/10 hover:border-scope-purple/30 transition-all duration-300"
        >
          {showControls ? "Hide" : "Show"} Controls
        </button>
      </div>

      {/* COMPACT CONTROLS DOCK - Bottom */}
      {showControls && (
        <div className="flex-none glass-radiant border-t border-scope-purple/20">
          <div className="flex items-stretch divide-x divide-white/5">
            {/* Audio Source */}
            <div className="flex-1 p-4">
              <h3 className="font-display text-[11px] uppercase tracking-[0.2em] text-scope-cyan/70 mb-3">Audio</h3>
              <AudioPlayer
                onAudioElement={handleAudioElement}
                onPlayStateChange={handlePlayStateChange}
                compact
              />
            </div>

            {/* Theme Selector */}
            <div className="flex-[2] p-4">
              <h3 className="font-display text-[11px] uppercase tracking-[0.2em] text-scope-cyan/70 mb-3">Theme</h3>
              <ThemeSelector
                themes={presetThemes}
                currentTheme={currentTheme}
                onThemeChange={setTheme}
                compact
              />
            </div>

            {/* Analysis */}
            <div className="flex-1 p-4">
              <h3 className="font-display text-[11px] uppercase tracking-[0.2em] text-scope-cyan/70 mb-3">Analysis</h3>
              <AnalysisMeter analysis={state.analysis} parameters={parameters} compact />
            </div>

            {/* Status */}
            <div className="w-36 p-4 flex flex-col justify-center glass bg-black/20">
              <h3 className="font-display text-[11px] uppercase tracking-[0.2em] text-scope-cyan/70 mb-2">Status</h3>
              <div className="flex items-center gap-2">
                <div className={`w-2 h-2 rounded-full ${scopeStream ? "bg-scope-cyan shadow-[0_0_8px_rgba(6,182,212,0.6)]" : "bg-gray-600"}`} />
                <span className="text-xs text-white/60">{scopeStream ? "Connected" : "Offline"}</span>
              </div>
              <div className="flex items-center gap-2 mt-1.5">
                <div className={`w-2 h-2 rounded-full ${state.playback === "playing" ? "bg-scope-purple animate-pulse shadow-[0_0_8px_rgba(139,92,246,0.6)]" : "bg-gray-600"}`} />
                <span className="text-xs text-white/60">{state.playback === "playing" ? "Generating" : "Idle"}</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
