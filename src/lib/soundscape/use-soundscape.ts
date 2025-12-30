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
  setDataChannel: (channel: RTCDataChannel) => void;

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

  // Compute initial theme once
  const getInitialTheme = useCallback((): Theme => {
    if (typeof initialTheme === "string") {
      return THEMES_BY_ID[initialTheme] ?? THEMES_BY_ID["cosmic-voyage"];
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

  const [state, setState] = useState<SoundscapeState>(() => ({
    playback: "idle",
    connection: "disconnected",
    activeTheme: getInitialTheme(),
    analysis: null,
    stats: null,
    error: null,
  }));

  const [parameters, setParameters] = useState<ScopeParameters | null>(null);

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
          log(`Theme "${themeIdOrInput}" not found, using cosmic-voyage`);
          return THEMES_BY_ID["cosmic-voyage"];
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
      setCurrentTheme(theme);

      if (mappingEngineRef.current) {
        mappingEngineRef.current.setTheme(theme);
      }

      setState((prev) => ({ ...prev, activeTheme: theme }));
      log("Theme changed:", theme.name);
    },
    [resolveTheme, log]
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

        // Create mapping engine with current theme
        const theme = currentTheme || THEMES_BY_ID["cosmic-voyage"];
        mappingEngineRef.current = new MappingEngine(theme);

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
    [currentTheme, updateRate, log]
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
    (channel: RTCDataChannel) => {
      // Store for later use (e.g., ambient mode)
      dataChannelRef.current = channel;

      if (parameterSenderRef.current) {
        parameterSenderRef.current.setDataChannel(channel);
      }
      setState((prev) => ({ ...prev, connection: "connected" }));
      log("Data channel connected");
    },
    [log]
  );

  // ============================================================================
  // Analysis Control
  // ============================================================================

  const handleAnalysis = useCallback(
    (analysis: AnalysisState) => {
      const now = performance.now();
      if (now - lastUiUpdateRef.current >= uiUpdateIntervalMs) {
        // Update UI state at a lower rate to avoid jank
        setState((prev) => ({ ...prev, analysis }));
        lastUiUpdateRef.current = now;
      }

      // Generate Scope parameters
      if (mappingEngineRef.current) {
        const params = mappingEngineRef.current.computeParameters(analysis);
        setParameters(params);

        // Send to Scope if connected
        if (parameterSenderRef.current) {
          parameterSenderRef.current.send(params);
        }
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
    if (!mappingEngineRef.current) {
      const theme = currentTheme || THEMES_BY_ID["cosmic-voyage"];
      mappingEngineRef.current = new MappingEngine(theme);
    }

    // Initialize parameter sender if needed and connect data channel
    if (!parameterSenderRef.current) {
      parameterSenderRef.current = new ParameterSender(updateRate);
    }
    parameterSenderRef.current.setDataChannel(dataChannelRef.current);

    log("Starting ambient mode");

    // Generate ambient parameters at ~10fps with gentle variations
    ambientIntervalRef.current = setInterval(() => {
      if (!mappingEngineRef.current || !parameterSenderRef.current) return;

      // Create gentle, slowly varying "ambient" analysis state
      ambientPhaseRef.current += 0.02;
      const phase = ambientPhaseRef.current;

      // Gentle sine wave oscillations for a calm, ambient feel
      const ambientAnalysis: AnalysisState = {
        features: {
          rms: 0.05 + 0.03 * Math.sin(phase),
          spectralCentroid: 800 + 200 * Math.sin(phase * 0.7),
          spectralFlatness: 0.2 + 0.1 * Math.sin(phase * 0.5),
          spectralRolloff: 4000,
          zcr: 0.1,
        },
        derived: {
          energy: 0.15 + 0.1 * Math.sin(phase * 0.3), // Low energy, gentle waves
          brightness: 0.4 + 0.2 * Math.sin(phase * 0.5),
          texture: 0.3 + 0.15 * Math.sin(phase * 0.4),
          energyDerivative: 0.01 * Math.cos(phase * 0.3),
          peakEnergy: 0.25,
        },
        beat: {
          isBeat: false,
          bpm: null,
          confidence: 0,
          lastBeatTime: 0,
        },
      };

      const params = mappingEngineRef.current.computeParameters(ambientAnalysis);
      setParameters(params);

      // Send to Scope if connected
      parameterSenderRef.current.send(params);
    }, 100); // 10fps for ambient mode

    setState((prev) => ({ ...prev, playback: "playing" }));
  }, [currentTheme, updateRate, log]);

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
