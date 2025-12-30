/**
 * Soundscape Studio Component
 * Main container orchestrating audio-reactive visual generation
 */

"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import { useSoundscape, DEFAULT_ASPECT_RATIO } from "@/lib/soundscape";
import type { AspectRatioConfig } from "@/lib/soundscape";
import type { IceCandidatePayload } from "@/lib/scope/types";
import { getScopeClient } from "@/lib/scope/client";
import { AudioPlayer } from "./AudioPlayer";
import { ThemeSelector } from "./ThemeSelector";
import { AnalysisMeter } from "./AnalysisMeter";
import { AspectRatioToggle } from "./AspectRatioToggle";

// Default pipeline for Soundscape (supports VACE + smooth transitions)
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
        stopAmbient(); // Stop ambient when audio plays
        start();
      } else {
        stop();
        // Resume ambient mode if connected
        if (scopeStream) {
          startAmbient();
        }
      }
    },
    [audioReady, start, stop, startAmbient, stopAmbient, scopeStream]
  );

  // Connect video stream to element and ensure playback
  useEffect(() => {
    if (videoRef.current && scopeStream) {
      videoRef.current.srcObject = scopeStream;
      // Explicitly call play() - autoPlay alone isn't always reliable
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
      // Cancel any pending reconnection
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
      // Close data channel
      if (dataChannelRef.current) {
        dataChannelRef.current.close();
      }
      // Close peer connection
      if (peerConnectionRef.current) {
        peerConnectionRef.current.close();
      }
    };
  }, []);

  // Disconnect from Scope and cleanup WebRTC resources
  // userInitiated: true if user clicked disconnect, false if connection dropped
  const handleDisconnectScope = useCallback((userInitiated = false) => {
    stopAmbient();
    setDataChannel(null);

    // Cancel any pending reconnection
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }

    // Close data channel
    if (dataChannelRef.current) {
      dataChannelRef.current.close();
      dataChannelRef.current = null;
    }

    // Close peer connection
    if (peerConnectionRef.current) {
      peerConnectionRef.current.close();
      peerConnectionRef.current = null;
    }

    // Clear stream
    setScopeStream(null);
    setConnectionStatus("");

    // Reset attempts on user-initiated disconnect
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
      setConnectionStatus("Checking server health...");
      const health = await scopeClient.checkHealth();
      if (health.status !== "ok") {
        throw new Error("Scope server is not healthy. Is the pod running?");
      }
      console.log("[Soundscape] Health check passed:", health);

      // Step 2: Load pipeline with current resolution (VACE disabled for text-only mode)
      setConnectionStatus(`Loading ${DEFAULT_PIPELINE} pipeline...`);
      const loadParams = {
        width: aspectRatio.resolution.width,
        height: aspectRatio.resolution.height,
        vace_enabled: false, // Soundscape uses text mode only, no reference images
      };
      const loaded = await scopeClient.loadPipeline(DEFAULT_PIPELINE, loadParams);
      if (!loaded) {
        throw new Error(`Failed to load pipeline: ${DEFAULT_PIPELINE}`);
      }
      setConnectionStatus("Waiting for pipeline...");
      const ready = await scopeClient.waitForPipelineLoaded();
      if (!ready) {
        throw new Error(`Pipeline failed to load: ${DEFAULT_PIPELINE}`);
      }
      console.log("[Soundscape] Pipeline loaded:", DEFAULT_PIPELINE);

      // Step 3: Get ICE servers
      setConnectionStatus("Getting ICE configuration...");
      const iceConfig = await scopeClient.getIceServers();
      if (!iceConfig) {
        throw new Error("Failed to get ICE servers");
      }
      console.log("[Soundscape] ICE servers received:", iceConfig.iceServers.length);

      // Step 4: Create peer connection
      setConnectionStatus("Creating WebRTC connection...");
      const pc = new RTCPeerConnection({
        iceServers: iceConfig.iceServers,
      });
      peerConnectionRef.current = pc;

      // Collect ICE candidates to send to server
      let sessionId: string | null = null;
      const pendingCandidates: IceCandidatePayload[] = [];
      pc.onicecandidate = async (event) => {
        if (!event.candidate) return;

        const payload: IceCandidatePayload = {
          candidate: event.candidate.candidate,
          sdpMid: event.candidate.sdpMid,
          sdpMLineIndex: event.candidate.sdpMLineIndex,
        };

        if (sessionId) {
          await scopeClient.addIceCandidates(sessionId, [payload]);
        } else {
          pendingCandidates.push(payload);
        }
      };

      // Handle incoming video track
      pc.ontrack = (event) => {
        console.log("[Soundscape] Received video track:", event.track.kind);
        if (event.track.kind === "video" && event.streams[0]) {
          setScopeStream(event.streams[0]);
          setConnectionStatus("Connected - Receiving video");
        }
      };

      // Monitor connection state with auto-reconnect
      pc.onconnectionstatechange = () => {
        console.log("[Soundscape] Connection state:", pc.connectionState);
        if (pc.connectionState === "failed" || pc.connectionState === "disconnected") {
          setScopeError("Connection lost");
          handleDisconnectScope(false); // Not user-initiated

          // Auto-reconnect if under max attempts
          setReconnectAttempts((prev) => {
            const newAttempts = prev + 1;
            if (newAttempts <= MAX_RECONNECT_ATTEMPTS) {
              console.log(`[Soundscape] Auto-reconnecting (attempt ${newAttempts}/${MAX_RECONNECT_ATTEMPTS})...`);
              setConnectionStatus(`Reconnecting (${newAttempts}/${MAX_RECONNECT_ATTEMPTS})...`);
              reconnectTimeoutRef.current = setTimeout(() => {
                handleConnectScope();
              }, RECONNECT_DELAY_MS * newAttempts); // Exponential backoff
            } else {
              setScopeError("Connection failed after multiple attempts. Click Retry to try again.");
            }
            return newAttempts;
          });
        }
      };

      // Monitor ICE connection state (critical for debugging)
      pc.oniceconnectionstatechange = () => {
        console.log("[Soundscape] ICE connection state:", pc.iceConnectionState);
        if (pc.iceConnectionState === "failed") {
          console.error("[Soundscape] ICE connection failed - likely NAT/firewall issue");
        }
        if (pc.iceConnectionState === "connected" || pc.iceConnectionState === "completed") {
          console.log("[Soundscape] ICE connected - media should flow");
        }
      };

      // Monitor ICE gathering state
      pc.onicegatheringstatechange = () => {
        console.log("[Soundscape] ICE gathering state:", pc.iceGatheringState);
      };

      // Expose for debugging (development only)
      if (process.env.NODE_ENV === "development") {
        (window as unknown as { debugPeerConnection: RTCPeerConnection }).debugPeerConnection = pc;
      }

      // Step 5: Add video transceiver (receive-only mode, no input video)
      // Note: Don't specify direction - let WebRTC negotiate naturally
      pc.addTransceiver("video");

      // Step 6: Create data channel for parameters
      const dataChannel = pc.createDataChannel("parameters", {
        ordered: true,
      });

      dataChannel.onopen = () => {
        console.log("[Soundscape] Data channel opened");
        dataChannelRef.current = dataChannel;
        // Connect to the soundscape parameter sender
        setDataChannel(dataChannel);
        // Start ambient mode now that data channel is ready (if no audio playing)
        if (!isPlaying) {
          startAmbient();
        }
      };

      dataChannel.onmessage = (event) => {
        try {
          const message = JSON.parse(event.data);
          if (message?.type === "stream_stopped") {
            const errorMessage = message.error_message || "Scope stream stopped";
            console.warn("[Soundscape] Stream stopped:", errorMessage);
            setScopeError(errorMessage);
            handleDisconnectScope(false); // Not user-initiated, may trigger reconnect
          }
        } catch (error) {
          console.warn("[Soundscape] Data channel message parse failed:", error);
        }
      };

      dataChannel.onerror = (error) => {
        console.error("[Soundscape] Data channel error:", error);
      };

      dataChannel.onclose = () => {
        console.log("[Soundscape] Data channel closed");
        dataChannelRef.current = null;
        setDataChannel(null);
        stopAmbient();
      };

      // Step 7: Create and send offer
      setConnectionStatus("Exchanging SDP...");
      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);

      // Send offer to Scope
      const localDesc = pc.localDescription;
      if (!localDesc) {
        throw new Error("Failed to create local description");
      }

      // Build initial parameters from current theme
      // Note: paused: false ensures generation starts immediately
      const initialParams = currentTheme
        ? {
            prompts: [{ text: currentTheme.basePrompt, weight: 1.0 }],
            noise_scale: currentTheme.ranges.noiseScale.min,
            denoising_step_list: currentTheme.ranges.denoisingSteps.min,
            manage_cache: true,
            paused: false,
          }
        : undefined;

      const answer = await scopeClient.createWebRtcOffer({
        sdp: localDesc.sdp,
        type: localDesc.type,
        initialParameters: initialParams,
      });

      if (!answer) {
        throw new Error("Failed to get answer from Scope");
      }

      // Step 8: Set remote description
      await pc.setRemoteDescription({
        sdp: answer.sdp,
        type: answer.type,
      });

      sessionId = answer.sessionId;
      console.log("[Soundscape] WebRTC connection established, session:", answer.sessionId);
      setConnectionStatus("Connected");

      // Reset reconnect attempts on successful connection
      setReconnectAttempts(0);
      setScopeError(null);

      // Note: ambient mode is started in dataChannel.onopen (when channel is ready)

      // Step 9: Send any queued ICE candidates
      if (pendingCandidates.length > 0) {
        await scopeClient.addIceCandidates(sessionId, pendingCandidates);
        pendingCandidates.length = 0;
      }

    } catch (error) {
      const message = error instanceof Error ? error.message : "Connection failed";
      console.error("[Soundscape] Connection error:", message);
      setScopeError(message);
      handleDisconnectScope();
    } finally {
      setIsConnecting(false);
    }
  }, [aspectRatio, currentTheme, setDataChannel, handleDisconnectScope, isPlaying, startAmbient]);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Left Column: Controls */}
      <div className="space-y-6">
        {/* Audio Section */}
        <section className="bg-gray-900 rounded-xl p-4">
          <h2 className="text-lg font-semibold mb-4">Audio Source</h2>
          <AudioPlayer
            onAudioElement={handleAudioElement}
            onPlayStateChange={handlePlayStateChange}
          />
        </section>

        {/* Theme Section */}
        <section className="bg-gray-900 rounded-xl p-4">
          <h2 className="text-lg font-semibold mb-4">Theme</h2>
          <ThemeSelector
            themes={presetThemes}
            currentTheme={currentTheme}
            onThemeChange={setTheme}
          />
        </section>
      </div>

      {/* Center Column: Output */}
      <div className="lg:col-span-1">
        <section className="bg-gray-900 rounded-xl p-4 h-full">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold">Visual Output</h2>
            <div className="flex items-center gap-2">
              {scopeStream && (
                <button
                  type="button"
                  onClick={() => handleDisconnectScope(true)}
                  className="px-2 py-1 bg-gray-700 hover:bg-red-500/80 text-gray-300 hover:text-white text-xs rounded transition-all"
                >
                  Disconnect
                </button>
              )}
              <AspectRatioToggle
                current={aspectRatio}
                onChange={setAspectRatio}
                disabled={!!scopeStream}
              />
            </div>
          </div>

          {/* Video Display - aspect ratio based on selection */}
          <div
            className={`
              relative bg-black rounded-lg overflow-hidden flex items-center justify-center
              ${aspectRatio.mode === "16:9" ? "aspect-video" : "aspect-[9/16]"}
            `}
          >
            {scopeStream ? (
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                className="w-full h-full object-cover"
              />
            ) : isConnecting ? (
              <div className="text-center p-6">
                <div className="text-5xl mb-4 animate-pulse">🔄</div>
                <p className="text-scope-cyan text-sm mb-2">
                  {connectionStatus || "Connecting..."}
                </p>
                <div className="w-32 h-1 bg-gray-700 rounded-full mx-auto overflow-hidden">
                  <div className="h-full bg-scope-cyan animate-pulse rounded-full w-2/3" />
                </div>
              </div>
            ) : (
              <div className="text-center p-6">
                <div className="text-6xl mb-4 opacity-50">🎨</div>
                <p className="text-gray-400 text-sm mb-4">
                  {isPlaying
                    ? "Connect to Scope to see visuals"
                    : "Connect for ambient visuals, or add audio for reactive mode"}
                </p>

                {/* Connect Button */}
                <button
                  type="button"
                  onClick={handleConnectScope}
                  className="px-4 py-2 rounded-lg font-medium transition-all bg-scope-purple hover:bg-scope-purple/80 text-white"
                >
                  Connect to Scope
                </button>

                {scopeError && (
                  <div className="mt-3 text-center">
                    <p className="text-red-400 text-xs mb-2" role="alert">
                      {scopeError}
                    </p>
                    {reconnectAttempts >= MAX_RECONNECT_ATTEMPTS && (
                      <button
                        type="button"
                        onClick={() => {
                          setReconnectAttempts(0);
                          setScopeError(null);
                          handleConnectScope();
                        }}
                        className="px-3 py-1.5 bg-scope-cyan hover:bg-scope-cyan/80 text-black text-sm rounded-lg font-medium transition-all"
                      >
                        Retry Connection
                      </button>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Status Bar */}
          <div className="flex justify-between text-xs text-gray-500 mt-2 px-1">
            <span>
              Audio: {state.playback === "playing" ? "Analyzing" : state.playback}
            </span>
            <span>
              Scope: {scopeStream ? "Connected" : isConnecting ? connectionStatus : "Disconnected"}
            </span>
          </div>
        </section>
      </div>

      {/* Right Column: Analysis */}
      <div>
        <section className="bg-gray-900 rounded-xl p-4">
          <h2 className="text-lg font-semibold mb-4">Live Analysis</h2>
          <AnalysisMeter analysis={state.analysis} parameters={parameters} />
        </section>

        {/* Current Theme Info */}
        {currentTheme && (
          <section className="bg-gray-900 rounded-xl p-4 mt-6">
            <h2 className="text-lg font-semibold mb-2">{currentTheme.name}</h2>
            <p className="text-sm text-gray-400 mb-3">{currentTheme.description}</p>

            {/* Beat Action */}
            <div className="text-xs">
              <span className="text-gray-500">Beat Action: </span>
              <span className="text-scope-cyan">
                {currentTheme.mappings.beats.enabled
                  ? currentTheme.mappings.beats.action.replace("_", " ")
                  : "disabled"}
              </span>
            </div>
          </section>
        )}
      </div>
    </div>
  );
}
