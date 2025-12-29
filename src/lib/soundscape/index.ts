/**
 * Soundscape Module
 * Audio-reactive visual generation for MetaDJ Scope
 */

// Core classes
export { AudioAnalyzer } from "./audio-analyzer";
export { MappingEngine, ParameterSender } from "./mapping-engine";

// Theme system
export {
  PRESET_THEMES,
  THEMES_BY_ID,
  COSMIC_VOYAGE,
  NEON_FOUNDRY,
  DIGITAL_FOREST,
  SYNTHWAVE_HIGHWAY,
  CRYSTAL_SANCTUARY,
  createCustomTheme,
  SUGGESTED_STYLE_MODIFIERS,
} from "./themes";

// React hook
export { useSoundscape } from "./use-soundscape";
export type { UseSoundscapeOptions, UseSoundscapeReturn } from "./use-soundscape";

// Types
export type {
  // Audio Analysis
  AudioFeatures,
  BeatInfo,
  AnalysisState,
  NormalizationConfig,

  // Theme System
  Theme,
  ThemeRanges,
  ThemeMappings,
  MappingTarget,
  MappingCurve,
  MappingParameter,
  BeatAction,
  BeatMapping,
  PromptVariation,
  ReactivityPreset,
  BeatResponse,
  CustomThemeInput,

  // Scope Parameters
  ScopeParameters,
  PromptEntry,
  PromptTransition,

  // State Management
  ConnectionState,
  PlaybackState,
  ConnectionStats,
  SoundscapeState,

  // Aspect Ratio
  AspectRatioMode,
  Resolution,
  AspectRatioConfig,
} from "./types";

// Re-export constants
export {
  DEFAULT_NORMALIZATION,
  ASPECT_PRESETS,
  DEFAULT_ASPECT_RATIO,
} from "./types";
