/**
 * Soundscape React Hook
 * Orchestrates audio analysis, theme mapping, and Scope parameter updates
 */

"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { AudioAnalyzer } from "./audio-analyzer";
import { MappingEngine, ParameterSender } from "./mapping-engine";
import { PRESET_THEMES, THEMES_BY_ID, createCustomTheme } from "./themes";
import type {
  Theme,
  AnalysisState,
  ScopeParameters,
  SoundscapeState,
  CustomThemeInput,
} from "./types";

// ============================================================================
// Constants - Single Source of Truth
// ============================================================================

/** Default theme ID when no theme is specified or lookup fails */
const DEFAULT_THEME_ID = "cosmic-voyage";

/** Get the default theme object */
const getDefaultTheme = (): Theme => THEMES_BY_ID[DEFAULT_THEME_ID];

// ============================================================================
// Hook Interface
// ============================================================================

export interface UseSoundscapeOptions {
  /** Initial theme ID or custom theme input */
  initialTheme?: string | CustomThemeInput;
  /** Target parameter update rate (Hz) */
  updateRate?: number;
  /** Target UI update rate (Hz) */
  uiUpdateRate?: number;
  /** Enable debug logging */
  debug?: boolean;
}

export interface UseSoundscapeReturn {
  /** Current state */
  state: SoundscapeState;
  /** Latest Scope parameters */
  parameters: ScopeParameters | null;
  /** Available preset themes */
  presetThemes: Theme[];

  /** Connect to audio element */
  connectAudio: (audioElement: HTMLAudioElement) => Promise<void>;
  /** Disconnect audio */
  disconnectAudio: () => void;
  /** Set the data channel for Scope communication */
  setDataChannel: (channel: RTCDataChannel | null) => void;

  /** Start analysis and parameter generation */
  start: () => void;
  /** Stop analysis */
  stop: () => void;

  /** Start ambient mode (no audio required) */
  startAmbient: () => void;
  /** Stop ambient mode */
  stopAmbient: () => void;

  /** Change active theme */
  setTheme: (themeIdOrInput: string | CustomThemeInput) => void;
  /** Get current theme */
  currentTheme: Theme;
}

// ============================================================================
// Hook Implementation
// ============================================================================

export function useSoundscape(options: UseSoundscapeOptions = {}): UseSoundscapeReturn {
  const {
    initialTheme = "cosmic-voyage",
    updateRate = 30,
    uiUpdateRate = 10,
    debug = false,
  } = options;

  // Compute initial theme once - uses single source of truth for fallback
  const getInitialTheme = useCallback((): Theme => {
    if (typeof initialTheme === "string") {
      return THEMES_BY_ID[initialTheme] ?? getDefaultTheme();
    }
    return createCustomTheme(initialTheme);
  }, [initialTheme]);

  // Core refs
  const analyzerRef = useRef<AudioAnalyzer | null>(null);
  const mappingEngineRef = useRef<MappingEngine | null>(null);
  const parameterSenderRef = useRef<ParameterSender | null>(null);
  const audioElementRef = useRef<HTMLAudioElement | null>(null);
  const lastUiUpdateRef = useRef(0);
  const uiUpdateIntervalMs = 1000 / uiUpdateRate;

  // Ambient mode refs
  const ambientIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const ambientPhaseRef = useRef(0);

  // Data channel ref (stored for ambient mode to use)
  const dataChannelRef = useRef<RTCDataChannel | null>(null);

  // State - initialize theme synchronously
  const [currentTheme, setCurrentTheme] = useState<Theme>(() => getInitialTheme());

  // CRITICAL: Use a ref to track the CURRENT theme for closures
  // This prevents stale closure issues where callbacks capture old theme state
  const currentThemeRef = useRef<Theme>(currentTheme);

  // Keep the ref in sync with state
  useEffect(() => {
    currentThemeRef.current = currentTheme;
  }, [currentTheme]);

  const [state, setState] = useState<SoundscapeState>(() => ({
    playback: "idle",
    connection: "disconnected",
    activeTheme: getInitialTheme(),
    analysis: null,
    stats: null,
    error: null,
  }));

  const [parameters, setParameters] = useState<ScopeParameters | null>(null);
  const parametersRef = useRef<ScopeParameters | null>(null);

  // Debug logger
  const log = useCallback(
    (...args: unknown[]) => {
      if (debug) {
        console.log("[Soundscape]", ...args);
      }
    },
    [debug]
  );

  // ============================================================================
  // Theme Management
  // ============================================================================

  const resolveTheme = useCallback(
    (themeIdOrInput: string | CustomThemeInput): Theme => {
      if (typeof themeIdOrInput === "string") {
        const preset = THEMES_BY_ID[themeIdOrInput];
        if (!preset) {
          log(`Theme "${themeIdOrInput}" not found, using default`);
          return getDefaultTheme();
        }
        return preset;
      }
      return createCustomTheme(themeIdOrInput);
    },
    [log]
  );

  const setTheme = useCallback(
    (themeIdOrInput: string | CustomThemeInput) => {
      const theme = resolveTheme(themeIdOrInput);

      // DEBUG: Log theme changes with stack trace to identify all callers
      if (debug) {
        console.log(`[Soundscape] 🎨 setTheme called: "${theme.id}" (${theme.name})`);
        if (theme.id === "cosmic-voyage") {
          console.trace("[Soundscape] Cosmic theme set - trace:");
        }
      }

      setCurrentTheme(theme);
      currentThemeRef.current = theme; // Immediately update ref too

      // Clear any pending params to prevent stale theme params from being sent
      if (parameterSenderRef.current) {
        parameterSenderRef.current.clearPending();
      }

      if (mappingEngineRef.current) {
        mappingEngineRef.current.setTheme(theme);
      }

      // If ambient mode is running, restart it with new theme
      // (ambient captures theme in closure, so need fresh start)
      if (ambientIntervalRef.current) {
        log("Restarting ambient for new theme");
        // Clear old interval
        clearInterval(ambientIntervalRef.current);
        ambientIntervalRef.current = null;

        // Send new prompt with LONG SMOOTH TRANSITION for ambient (very seamless)
        if (parameterSenderRef.current && dataChannelRef.current?.readyState === "open") {
          const newBasePrompt = `${theme.basePrompt}, ${theme.styleModifiers.join(", ")}, calm atmosphere, gentle flow`;
          const newPrompts = [{ text: newBasePrompt, weight: 1.0 }];
          const newParams: ScopeParameters = {
            prompts: newPrompts,
            denoisingSteps: [1000, 800, 600, 400, 250],
            noiseScale: 0.5,
            // AMBIENT: Extra long transition (20 frames) for very seamless theme blending
            transition: {
              target_prompts: newPrompts,
              num_steps: 20, // 20-frame crossfade - slow, dreamy theme transition
              temporal_interpolation_method: "slerp",
            },
          };
          parameterSenderRef.current.send(newParams);
          parametersRef.current = newParams;
          setParameters(newParams);
          log("Ambient: theme transition initiated with 20-frame crossfade");

          // Restart keep-alive - ONLY noise_scale updates, NO prompts
          // Server keeps generating toward the prompt we just sent
          ambientIntervalRef.current = setInterval(() => {
            if (!parameterSenderRef.current || !dataChannelRef.current) return;
            ambientPhaseRef.current += 0.01;
            const phase = ambientPhaseRef.current;

            // Send ONLY essential params - no prompts, no transition
            // This just keeps the connection alive without resetting anything
            const keepAlive = {
              noise_scale: 0.48 + 0.04 * Math.sin(phase),
              denoising_step_list: [1000, 800, 600, 400, 250],
              manage_cache: true,
              paused: false,
            };
            dataChannelRef.current.send(JSON.stringify(keepAlive));
          }, 5000); // 5s interval - very minimal, just connection keep-alive
        }
      }

      setState((prev) => ({ ...prev, activeTheme: theme }));
      log("Theme changed:", theme.name);
    },
    [resolveTheme, log, debug]
  );

  // Note: Theme is initialized synchronously in useState above

  // ============================================================================
  // Audio Connection
  // ============================================================================

  const connectAudio = useCallback(
    async (audioElement: HTMLAudioElement) => {
      try {
        log("Connecting to audio element...");

        if (analyzerRef.current && audioElementRef.current === audioElement) {
          setState((prev) => ({ ...prev, playback: "loading", error: null }));
          log("Audio element already connected");
          return;
        }

        if (analyzerRef.current) {
          analyzerRef.current.destroy();
          analyzerRef.current = null;
        }

        audioElementRef.current = audioElement;

        // Create analyzer
        const analyzer = new AudioAnalyzer();
        await analyzer.initialize(audioElement);
        analyzerRef.current = analyzer;

        // Reuse existing mapping engine if available, otherwise create new one
        // CRITICAL: Use ref to get CURRENT theme, not stale closure value
        const theme = currentThemeRef.current;

        if (mappingEngineRef.current) {
          // Engine exists - update to current theme
          mappingEngineRef.current.setTheme(theme);
          log("Reusing mapping engine with theme:", theme.name);
        } else {
          mappingEngineRef.current = new MappingEngine(theme);
          log("Created mapping engine with theme:", theme.name);
        }

        // Create parameter sender
        parameterSenderRef.current = new ParameterSender(updateRate);

        // Connect data channel if already available (Scope connected before audio)
        if (dataChannelRef.current && dataChannelRef.current.readyState === "open") {
          parameterSenderRef.current.setDataChannel(dataChannelRef.current);
          log("Connected parameter sender to existing data channel");
        }

        setState((prev) => ({ ...prev, playback: "loading", error: null }));
        log("Audio connected successfully");
      } catch (error) {
        const message = error instanceof Error ? error.message : "Failed to connect audio";
        setState((prev) => ({ ...prev, error: message }));
        log("Audio connection failed:", message);
        throw error;
      }
    },
    [updateRate, log] // Removed currentTheme - we use currentThemeRef instead
  );

  const disconnectAudio = useCallback(() => {
    if (analyzerRef.current) {
      analyzerRef.current.destroy();
      analyzerRef.current = null;
    }
    audioElementRef.current = null;
    setState((prev) => ({ ...prev, playback: "idle" }));
    log("Audio disconnected");
  }, [log]);

  // ============================================================================
  // Scope Connection
  // ============================================================================

  const setDataChannel = useCallback(
    (channel: RTCDataChannel | null) => {
      // Store for later use (e.g., ambient mode)
      dataChannelRef.current = channel;

      if (parameterSenderRef.current) {
        parameterSenderRef.current.setDataChannel(channel);
      }
      setState((prev) => ({
        ...prev,
        connection: channel ? "connected" : "disconnected",
      }));
      log(channel ? "Data channel connected" : "Data channel cleared");
    },
    [log]
  );

  // ============================================================================
  // Analysis Control
  // ============================================================================

  // Debug: track analysis frames for periodic logging
  const analysisFrameCountRef = useRef(0);

  const handleAnalysis = useCallback(
    (analysis: AnalysisState) => {
      const now = performance.now();
      const shouldUpdateUi = now - lastUiUpdateRef.current >= uiUpdateIntervalMs;

      // Debug: Log that analysis is running every ~3 seconds (at 30Hz UI rate)
      analysisFrameCountRef.current++;
      if (debug && analysisFrameCountRef.current % 90 === 0) {
        const energy = analysis.derived.energy;
        const brightness = analysis.derived.brightness;
        log(`📊 Audio analysis active - Energy: ${energy.toFixed(3)}, Brightness: ${brightness.toFixed(3)}, Beat: ${analysis.beat.isBeat}`);
      }

      // Generate Scope parameters
      if (mappingEngineRef.current) {
        const params = mappingEngineRef.current.computeParameters(analysis);
        parametersRef.current = params;

        // Send to Scope if connected
        if (parameterSenderRef.current) {
          parameterSenderRef.current.send(params);
        }
      }

      if (shouldUpdateUi) {
        // Update UI state at a lower rate to avoid jank
        setState((prev) => ({ ...prev, analysis }));
        setParameters(parametersRef.current);
        lastUiUpdateRef.current = now;
      }
    },
    [uiUpdateIntervalMs]
  );

  const start = useCallback(async () => {
    if (!analyzerRef.current) {
      log("Cannot start: no audio connected");
      return;
    }

    // Resume audio context (required after user interaction)
    await analyzerRef.current.resume();

    // Start analysis
    analyzerRef.current.start(handleAnalysis);
    setState((prev) => ({ ...prev, playback: "playing" }));
    log("Analysis started");
  }, [handleAnalysis, log]);

  const stop = useCallback(() => {
    if (analyzerRef.current) {
      analyzerRef.current.stop();
    }
    setState((prev) => ({ ...prev, playback: "paused" }));
    log("Analysis stopped");
  }, [log]);

  // ============================================================================
  // Ambient Mode (no audio required)
  // ============================================================================

  const startAmbient = useCallback(() => {
    // Don't start if already running
    if (ambientIntervalRef.current) {
      return;
    }

    // Need a data channel to send parameters
    if (!dataChannelRef.current || dataChannelRef.current.readyState !== "open") {
      log("Cannot start ambient: no open data channel");
      return;
    }

    // Initialize mapping engine if needed (without audio analyzer)
    // CRITICAL: Use ref to get CURRENT theme, not stale closure value
    const theme = currentThemeRef.current;

    if (!mappingEngineRef.current) {
      mappingEngineRef.current = new MappingEngine(theme);
      log("Created mapping engine for ambient with theme:", theme.name);
    } else {
      // Ensure engine has the current theme (setTheme handles cache reset if theme changed)
      mappingEngineRef.current.setTheme(theme);
    }

    // Initialize parameter sender if needed and connect data channel
    if (!parameterSenderRef.current) {
      parameterSenderRef.current = new ParameterSender(updateRate);
    }
    parameterSenderRef.current.setDataChannel(dataChannelRef.current);

    log("Starting ambient mode");

    // AMBIENT MODE: Send ONE prompt with long transition, then ONLY noise_scale updates
    // Prompt is set ONCE and never resent - server keeps generating toward it
    const basePrompt = `${theme.basePrompt}, ${theme.styleModifiers.join(", ")}, calm atmosphere, gentle flow`;
    const ambientPrompts = [{ text: basePrompt, weight: 1.0 }];

    // Send initial ambient params with long transition (smooth start)
    const ambientParams: ScopeParameters = {
      prompts: ambientPrompts,
      denoisingSteps: [1000, 800, 600, 400, 250],
      noiseScale: 0.5,
      // AMBIENT: Long transition (15 frames) for smooth visual start
      transition: {
        target_prompts: ambientPrompts,
        num_steps: 15, // 15-frame blend for gentle initial start
        temporal_interpolation_method: "slerp",
      },
    };

    parameterSenderRef.current.send(ambientParams);
    parametersRef.current = ambientParams;
    setParameters(ambientParams);
    log("Ambient: started with theme:", theme.name, "(15-frame transition)");

    // Keep-alive interval - ONLY noise_scale updates, NO prompts
    // Server keeps generating toward the prompt we already sent
    // This prevents any prompt resets or visual discontinuities
    ambientIntervalRef.current = setInterval(() => {
      if (!dataChannelRef.current || dataChannelRef.current.readyState !== "open") return;

      ambientPhaseRef.current += 0.01;
      const phase = ambientPhaseRef.current;

      // Send ONLY essential params - no prompts, no transition
      // Just keeps connection alive with subtle noise variation
      const keepAlive = {
        noise_scale: 0.48 + 0.04 * Math.sin(phase),
        denoising_step_list: [1000, 800, 600, 400, 250],
        manage_cache: true,
        paused: false,
      };
      dataChannelRef.current.send(JSON.stringify(keepAlive));
    }, 5000); // 5s interval - minimal, just connection keep-alive

    setState((prev) => ({ ...prev, playback: "playing" }));
  }, [updateRate, log]); // Removed currentTheme - we use currentThemeRef instead

  const stopAmbient = useCallback(() => {
    if (ambientIntervalRef.current) {
      clearInterval(ambientIntervalRef.current);
      ambientIntervalRef.current = null;
      log("Ambient mode stopped");
    }
  }, [log]);

  // ============================================================================
  // Cleanup
  // ============================================================================

  useEffect(() => {
    return () => {
      disconnectAudio();
      stopAmbient();
    };
  }, [disconnectAudio, stopAmbient]);

  // ============================================================================
  // Return
  // ============================================================================

  return {
    state,
    parameters,
    presetThemes: PRESET_THEMES,
    connectAudio,
    disconnectAudio,
    setDataChannel,
    start,
    stop,
    startAmbient,
    stopAmbient,
    setTheme,
    currentTheme,
  };
}

// ============================================================================
// Export Types
// ============================================================================

export type { Theme, AnalysisState, ScopeParameters, SoundscapeState };
