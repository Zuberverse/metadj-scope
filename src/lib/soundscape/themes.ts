/**
 * Soundscape Theme Presets
 * MetaDJ brand-aligned visual themes for audio-reactive generation
 */

import type {
  Theme,
  CustomThemeInput,
  ReactivityPreset,
  BeatResponse,
} from "./types";

// ============================================================================
// Preset Themes (MetaDJ Brand-Aligned)
// ============================================================================

/**
 * Cosmic Voyage - The signature MetaDJ journey through digital space
 */
export const COSMIC_VOYAGE: Theme = {
  id: "cosmic-voyage",
  name: "Cosmic Voyage",
  description: "Journey through neon-lit digital cosmos",

  basePrompt:
    "cosmic digital landscape, neon purple and cyan nebula, " +
    "floating geometric structures, ethereal light particles, " +
    "deep space atmosphere, stars and galaxies, " +
    "magenta energy accents, transformation journey",
  styleModifiers: ["cinematic lighting", "depth of field", "volumetric fog"],
  negativePrompt: "blurry, low quality, text, watermark, human faces",

  ranges: {
    denoisingSteps: { min: [700, 400], max: [1000, 750, 500, 250] },
    noiseScale: { min: 0.3, max: 0.9 },
    vaceScale: { min: 0.5, max: 1.5 },
    transitionSpeed: { min: 4, max: 16 },
  },

  mappings: {
    energy: [
      {
        parameter: "noiseScale",
        curve: "exponential",
        sensitivity: 1.2,
        invert: false,
      },
      {
        parameter: "denoisingSteps",
        curve: "stepped",
        sensitivity: 1.0,
        invert: true,
      },
    ],
    brightness: [
      {
        parameter: "promptWeight",
        curve: "linear",
        sensitivity: 0.8,
        invert: false,
      },
    ],
    texture: [],
    beats: {
      enabled: true,
      action: "pulse_noise",
      intensity: 0.3,
      cooldownMs: 200,
    },
  },

  promptVariations: {
    trigger: "energy_spike",
    prompts: [
      "cosmic explosion, supernova burst, intense neon flare",
      "wormhole opening, reality bending, dimensional rift",
    ],
    blendDuration: 8,
  },
};

/**
 * Neon Foundry - The AI Foundry creative sanctuary
 */
export const NEON_FOUNDRY: Theme = {
  id: "neon-foundry",
  name: "Neon Foundry",
  description: "Inside the Zuberant AI Foundry - where creation happens",

  basePrompt:
    "futuristic workshop interior, glowing machinery, " +
    "holographic displays in cyan, purple ambient lighting, " +
    "gothic architecture meets technology, creative forge, " +
    "magenta sparks, AI foundry aesthetic",
  styleModifiers: ["industrial aesthetic", "dramatic shadows", "neon accents"],
  negativePrompt: "outdoor, nature, daylight, cartoon",

  ranges: {
    denoisingSteps: { min: [800, 500], max: [1000, 800, 600, 400] },
    noiseScale: { min: 0.4, max: 0.85 },
    vaceScale: { min: 0.8, max: 1.8 },
    transitionSpeed: { min: 6, max: 20 },
  },

  mappings: {
    energy: [
      {
        parameter: "noiseScale",
        curve: "linear",
        sensitivity: 1.0,
        invert: false,
      },
    ],
    brightness: [
      {
        parameter: "vaceScale",
        curve: "logarithmic",
        sensitivity: 0.6,
        invert: true,
      },
    ],
    texture: [
      {
        parameter: "denoisingSteps",
        curve: "stepped",
        sensitivity: 1.2,
        invert: false,
      },
    ],
    beats: {
      enabled: true,
      action: "cache_reset",
      intensity: 0.5,
      cooldownMs: 500,
    },
  },
};

/**
 * Digital Forest - Nature meets technology
 */
export const DIGITAL_FOREST: Theme = {
  id: "digital-forest",
  name: "Digital Forest",
  description: "Bioluminescent nature infused with technology",

  basePrompt:
    "enchanted forest at night, bioluminescent plants, " +
    "floating particles, cyan and magenta glow, " +
    "mystical atmosphere, tech-organic fusion, " +
    "purple shadows, digital nature harmony",
  styleModifiers: ["magical realism", "soft glow", "ethereal"],
  negativePrompt: "urban, concrete, harsh lighting, realistic",

  ranges: {
    denoisingSteps: { min: [750, 450], max: [1000, 750, 500, 250] },
    noiseScale: { min: 0.35, max: 0.8 },
    vaceScale: { min: 0.6, max: 1.4 },
    transitionSpeed: { min: 8, max: 24 },
  },

  mappings: {
    energy: [
      {
        parameter: "noiseScale",
        curve: "logarithmic",
        sensitivity: 0.9,
        invert: false,
      },
    ],
    brightness: [
      {
        parameter: "promptWeight",
        curve: "linear",
        sensitivity: 1.1,
        invert: false,
      },
    ],
    texture: [
      {
        parameter: "vaceScale",
        curve: "linear",
        sensitivity: 0.7,
        invert: false,
      },
    ],
    beats: {
      enabled: true,
      action: "prompt_cycle",
      intensity: 0.4,
      cooldownMs: 300,
    },
  },

  promptVariations: {
    trigger: "beat",
    prompts: [
      "fireflies swarm, particles dance, energy surge",
      "aurora appears, light ribbons flow, magical pulse",
    ],
    blendDuration: 12,
  },
};

/**
 * Synthwave Highway - 80s retro-futurism in motion
 */
export const SYNTHWAVE_HIGHWAY: Theme = {
  id: "synthwave-highway",
  name: "Synthwave Highway",
  description: "80s retro-futuristic endless drive",

  basePrompt:
    "synthwave landscape, neon grid highway, " +
    "sunset gradient sky in purple and magenta, palm trees silhouette, " +
    "retro sports car, vaporwave aesthetic, cyan accent lights",
  styleModifiers: ["80s aesthetic", "chromatic aberration", "scan lines"],
  negativePrompt: "modern, realistic, daytime, cloudy",

  ranges: {
    denoisingSteps: { min: [700, 400], max: [950, 700, 450] },
    noiseScale: { min: 0.4, max: 0.95 },
    vaceScale: { min: 0.4, max: 1.2 },
    transitionSpeed: { min: 4, max: 12 },
  },

  mappings: {
    energy: [
      {
        parameter: "noiseScale",
        curve: "exponential",
        sensitivity: 1.4,
        invert: false,
      },
      {
        parameter: "denoisingSteps",
        curve: "stepped",
        sensitivity: 1.0,
        invert: true,
      },
    ],
    brightness: [],
    texture: [
      {
        parameter: "vaceScale",
        curve: "linear",
        sensitivity: 0.5,
        invert: true,
      },
    ],
    beats: {
      enabled: true,
      action: "pulse_noise",
      intensity: 0.5,
      cooldownMs: 150,
    },
  },
};

/**
 * Crystal Sanctuary - The gothic castle interior
 */
export const CRYSTAL_SANCTUARY: Theme = {
  id: "crystal-sanctuary",
  name: "Crystal Sanctuary",
  description: "Inside the gothic castle where transformation happens",

  basePrompt:
    "gothic castle interior, stained glass windows in purple and cyan, " +
    "crystal chandeliers, candlelight and magical orbs, " +
    "stone arches, mystical atmosphere, magenta light beams, " +
    "sanctuary of creation, ethereal mist",
  styleModifiers: [
    "dramatic lighting",
    "gothic architecture",
    "magical realism",
  ],
  negativePrompt: "modern, outdoor, daylight, minimalist",

  ranges: {
    denoisingSteps: { min: [800, 500], max: [1000, 800, 600, 400] },
    noiseScale: { min: 0.35, max: 0.8 },
    vaceScale: { min: 0.7, max: 1.6 },
    transitionSpeed: { min: 8, max: 20 },
  },

  mappings: {
    energy: [
      {
        parameter: "noiseScale",
        curve: "logarithmic",
        sensitivity: 1.0,
        invert: false,
      },
    ],
    brightness: [
      {
        parameter: "vaceScale",
        curve: "linear",
        sensitivity: 0.8,
        invert: false,
      },
      {
        parameter: "promptWeight",
        curve: "linear",
        sensitivity: 0.6,
        invert: false,
      },
    ],
    texture: [
      {
        parameter: "denoisingSteps",
        curve: "stepped",
        sensitivity: 0.8,
        invert: false,
      },
    ],
    beats: {
      enabled: true,
      action: "transition_trigger",
      intensity: 0.4,
      cooldownMs: 400,
    },
  },

  promptVariations: {
    trigger: "energy_spike",
    prompts: [
      "magical energy surge, crystals illuminate, power awakening",
      "stained glass transforms, light dances, sanctuary pulses",
    ],
    blendDuration: 10,
  },
};

// ============================================================================
// All Preset Themes
// ============================================================================

export const PRESET_THEMES: Theme[] = [
  COSMIC_VOYAGE,
  NEON_FOUNDRY,
  DIGITAL_FOREST,
  SYNTHWAVE_HIGHWAY,
  CRYSTAL_SANCTUARY,
];

export const THEMES_BY_ID: Record<string, Theme> = {
  "cosmic-voyage": COSMIC_VOYAGE,
  "neon-foundry": NEON_FOUNDRY,
  "digital-forest": DIGITAL_FOREST,
  "synthwave-highway": SYNTHWAVE_HIGHWAY,
  "crystal-sanctuary": CRYSTAL_SANCTUARY,
};

// ============================================================================
// Custom Theme Factory
// ============================================================================

const REACTIVITY_PRESETS: Record<
  ReactivityPreset,
  { noiseSensitivity: number; stepsSensitivity: number }
> = {
  subtle: { noiseSensitivity: 0.5, stepsSensitivity: 0.3 },
  balanced: { noiseSensitivity: 1.0, stepsSensitivity: 0.7 },
  intense: { noiseSensitivity: 1.5, stepsSensitivity: 1.2 },
  chaotic: { noiseSensitivity: 2.0, stepsSensitivity: 1.5 },
};

const BEAT_RESPONSE_MAP: Record<
  BeatResponse,
  { enabled: boolean; action: Theme["mappings"]["beats"]["action"]; intensity: number }
> = {
  none: { enabled: false, action: "pulse_noise", intensity: 0 },
  pulse: { enabled: true, action: "pulse_noise", intensity: 0.3 },
  shift: { enabled: true, action: "prompt_cycle", intensity: 0.4 },
  burst: { enabled: true, action: "cache_reset", intensity: 0.6 },
};

/**
 * Create a custom theme from simplified input
 */
export function createCustomTheme(input: CustomThemeInput): Theme {
  const preset = REACTIVITY_PRESETS[input.reactivity || "balanced"];
  const beatConfig = BEAT_RESPONSE_MAP[input.beatResponse || "pulse"];

  return {
    id: `custom-${Date.now()}`,
    name: "Custom Theme",
    description: input.prompt.slice(0, 50) + "...",

    basePrompt: input.prompt,
    styleModifiers: input.style || ["high quality", "detailed"],
    negativePrompt: "blurry, low quality, distorted",

    ranges: {
      denoisingSteps: { min: [700, 400], max: [1000, 750, 500, 250] },
      noiseScale: { min: 0.3, max: 0.9 },
      vaceScale: { min: 0.5, max: 1.5 },
      transitionSpeed: { min: 4, max: 16 },
    },

    mappings: {
      energy: [
        {
          parameter: "noiseScale",
          curve: "exponential",
          sensitivity: preset.noiseSensitivity,
          invert: false,
        },
        {
          parameter: "denoisingSteps",
          curve: "stepped",
          sensitivity: preset.stepsSensitivity,
          invert: true,
        },
      ],
      brightness: [
        {
          parameter: "promptWeight",
          curve: "linear",
          sensitivity: 0.8,
          invert: false,
        },
      ],
      texture: [],
      beats: {
        enabled: beatConfig.enabled,
        action: beatConfig.action,
        intensity: beatConfig.intensity,
        cooldownMs: beatConfig.action === "cache_reset" ? 500 : 200,
      },
    },
  };
}

// ============================================================================
// Style Modifier Suggestions
// ============================================================================

export const SUGGESTED_STYLE_MODIFIERS = [
  "cinematic",
  "dreamy",
  "dark",
  "vibrant",
  "minimal",
  "abstract",
  "geometric",
  "organic",
  "glitch",
  "neon",
  "ethereal",
  "dramatic",
  "soft",
  "intense",
  "mystical",
];
