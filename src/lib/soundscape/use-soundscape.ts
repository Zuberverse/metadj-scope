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

        // Send new prompt immediately with fresh theme
        if (parameterSenderRef.current && dataChannelRef.current?.readyState === "open") {
          const newBasePrompt = `${theme.basePrompt}, ${theme.styleModifiers.join(", ")}, calm atmosphere, gentle flow`;
          const newParams: ScopeParameters = {
            prompts: [{ text: newBasePrompt, weight: 1.0 }],
            denoisingSteps: [1000, 750, 500, 250],
            noiseScale: 0.5,
            resetCache: true,
          };
          parameterSenderRef.current.send(newParams);
          parametersRef.current = newParams;
          setParameters(newParams);

          // Restart keep-alive with new theme
          const capturedPrompt = newBasePrompt;
          ambientIntervalRef.current = setInterval(() => {
            if (!parameterSenderRef.current) return;
            ambientPhaseRef.current += 0.01;
            const phase = ambientPhaseRef.current;
            parameterSenderRef.current.send({
              prompts: [{ text: capturedPrompt, weight: 1.0 }],
              denoisingSteps: [1000, 750, 500, 250],
              noiseScale: 0.48 + 0.04 * Math.sin(phase),
            });
          }, 2000);
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

    // AMBIENT MODE: Send ONE static prompt, then just keep connection alive
    // Prompt only changes when theme is toggled (handled by setTheme)
    // NOTE: `theme` is already declared above from currentThemeRef.current
    const basePrompt = `${theme.basePrompt}, ${theme.styleModifiers.join(", ")}, calm atmosphere, gentle flow`;

    // Send initial ambient params once
    const ambientParams: ScopeParameters = {
      prompts: [{ text: basePrompt, weight: 1.0 }],
      denoisingSteps: [1000, 750, 500, 250],
      noiseScale: 0.5,
      resetCache: true, // Fresh start for ambient
    };

    parameterSenderRef.current.send(ambientParams);
    parametersRef.current = ambientParams;
    setParameters(ambientParams);
    log("Ambient: sent initial prompt for theme:", theme.name);

    // Keep-alive interval - just gentle noise_scale variation, NO prompt changes
    ambientIntervalRef.current = setInterval(() => {
      if (!parameterSenderRef.current) return;

      ambientPhaseRef.current += 0.01;
      const phase = ambientPhaseRef.current;

      // Send ONLY noise_scale updates - same prompt, just subtle evolution
      const keepAliveParams: ScopeParameters = {
        prompts: [{ text: basePrompt, weight: 1.0 }], // Same prompt every time
        denoisingSteps: [1000, 750, 500, 250],
        noiseScale: 0.48 + 0.04 * Math.sin(phase), // Subtle variation
      };

      parameterSenderRef.current.send(keepAliveParams);
    }, 2000); // Very slow - just keep connection alive

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
