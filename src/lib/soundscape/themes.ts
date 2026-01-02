/**
 * Soundscape Theme Presets
 * MetaDJ brand-aligned visual themes for audio-reactive generation
 *
 * SCOPE API NOTES (what's actually sent vs design intent):
 * - basePrompt + styleModifiers: SENT (combined with intensity/temporal descriptors)
 * - negativePrompt: NOT SENT (Scope API doesn't support negative prompts)
 * - ranges.noiseScale: USED (mapped from audio energy)
 * - ranges.vaceScale: NOT USED (Soundscape is text-only mode, no VACE ref images)
 * - ranges.denoisingSteps: USED (fixed 4-step schedule for quality)
 * - ranges.transitionSpeed: NOT DIRECTLY USED (transitions use fixed step counts)
 * - mappings.energy → noiseScale: ACTIVE
 * - mappings.brightness → promptWeight: NOT ACTIVE (promptWeight not a Scope param)
 * - mappings.texture → vaceScale: NOT ACTIVE (VACE disabled for text-only)
 * - mappings.beats: ALL ACTIONS NOW = NOISE BOOST ONLY (no prompt changes on beats)
 * - promptVariations: ONLY triggered by energy_spike (beat trigger bypassed)
 *
 * These design values are preserved for future expansion or reference.
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
    "adventurous flythrough, dynamic camera movement, soaring through " +
    "cosmic digital landscape, neon purple and cyan nebula, " +
    "floating geometric structures, ethereal light particles, " +
    "deep space atmosphere, stars and galaxies rushing past, " +
    "magenta energy accents, epic journey forward",
  styleModifiers: ["cinematic lighting", "depth of field", "volumetric fog", "high definition", "ultra detailed"],
  negativePrompt: "blurry, low quality, text, watermark, human faces",

  ranges: {
    denoisingSteps: { min: [700, 400], max: [1000, 750, 500, 250] },
    noiseScale: { min: 0.5, max: 0.7 }, // Higher floor for more evolution
    vaceScale: { min: 0.5, max: 1.5 },
    transitionSpeed: { min: 4, max: 16 },
  },

  mappings: {
    energy: [
      {
        parameter: "noiseScale",
        curve: "exponential",
        sensitivity: 1.4, // Increased sensitivity
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
      action: "pulse_noise", // Smooth energy boost, preserves continuity
      intensity: 0.5,
      cooldownMs: 200,
    },
  },

  promptVariations: {
    trigger: "energy_spike",
    prompts: [
      // FIRE VERSION - orange/red solar flares (completely different color palette)
      "solar flare explosion, molten sun surface, orange and red fire, burning plasma streams, intense heat waves, fiery corona burst, magma flowing through space",
      // ICE VERSION - blue/white frozen crystals (opposite of the base purple/cyan)
      "frozen crystal cavern, ice blue glacial formations, white snow particles, arctic aurora, crystalline structures, frozen in time, sub-zero deep space",
    ],
    blendDuration: 8, // Smooth transitions for seamless energy spike visuals
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
    "adventurous flythrough, sweeping camera movement, gliding through " +
    "futuristic workshop interior, glowing machinery passing by, " +
    "holographic displays in cyan, purple ambient lighting, " +
    "gothic architecture meets technology, creative forge, " +
    "magenta sparks flying past, AI foundry exploration",
  styleModifiers: ["industrial aesthetic", "dramatic shadows", "neon accents", "high definition", "sharp details"],
  negativePrompt: "outdoor, nature, daylight, cartoon",

  ranges: {
    denoisingSteps: { min: [800, 500], max: [1000, 800, 600, 400] },
    noiseScale: { min: 0.5, max: 0.7 }, // Higher floor for more evolution
    vaceScale: { min: 0.8, max: 1.8 },
    transitionSpeed: { min: 6, max: 20 },
  },

  mappings: {
    energy: [
      {
        parameter: "noiseScale",
        curve: "linear",
        sensitivity: 1.2, // Increased sensitivity
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
      action: "pulse_noise", // Smooth energy boost, preserves continuity
      intensity: 0.6,
      cooldownMs: 200,
    },
  },

  promptVariations: {
    trigger: "energy_spike",
    prompts: [
      "forge ignition, molten metal flow, sparks eruption, creation surge",
      "hologram glitch, digital overload, system surge, data explosion",
      "machine awakening, gears spinning, power surge, foundry alive",
      "neon overload, lights flashing, industrial pulse, electric storm",
    ],
    blendDuration: 8, // Smooth transitions for seamless energy spike visuals
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
    "adventurous flythrough, flowing camera movement, weaving through " +
    "enchanted forest at night, bioluminescent plants rushing past, " +
    "floating particles streaming by, cyan and magenta glow, " +
    "mystical atmosphere, tech-organic fusion, " +
    "purple shadows, dynamic forest exploration",
  styleModifiers: ["magical realism", "soft glow", "ethereal", "high definition", "crisp details"],
  negativePrompt: "urban, concrete, harsh lighting, realistic",

  ranges: {
    denoisingSteps: { min: [750, 450], max: [1000, 750, 500, 250] },
    noiseScale: { min: 0.48, max: 0.65 }, // Higher floor for more evolution
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
      action: "pulse_noise", // Changed from prompt_cycle - beats only affect noise now
      intensity: 0.4,
      cooldownMs: 300,
    },
  },

  promptVariations: {
    trigger: "energy_spike", // Changed from beat - prompts only change on energy spikes
    prompts: [
      "fireflies swarm, particles dance, energy surge",
      "aurora appears, light ribbons flow, magical pulse",
    ],
    blendDuration: 8, // Smooth transitions for seamless energy spike visuals
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
    "high speed flythrough, racing forward, speeding down " +
    "synthwave landscape, neon grid highway stretching ahead, " +
    "sunset gradient sky in purple and magenta, palm trees rushing past, " +
    "retro sports car POV, vaporwave aesthetic, cyan accent lights, motion blur",
  styleModifiers: ["80s aesthetic", "chromatic aberration", "scan lines", "high definition", "vibrant colors"],
  negativePrompt: "modern, realistic, daytime, cloudy",

  ranges: {
    denoisingSteps: { min: [700, 400], max: [950, 700, 450] },
    noiseScale: { min: 0.5, max: 0.72 }, // Higher floor for more evolution
    vaceScale: { min: 0.4, max: 1.2 },
    transitionSpeed: { min: 4, max: 12 },
  },

  mappings: {
    energy: [
      {
        parameter: "noiseScale",
        curve: "exponential",
        sensitivity: 1.5, // Increased for more responsiveness
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
      action: "pulse_noise", // Smooth energy boost, preserves continuity
      intensity: 0.6,
      cooldownMs: 200,
    },
  },

  promptVariations: {
    trigger: "energy_spike",
    prompts: [
      "neon burst, grid explosion, synthwave lightning, retro energy surge",
      "speed lines, motion blur, accelerating, highway rush",
      "sun flare, horizon glow, sunset explosion, sky ignition",
      "chrome reflection, mirror flash, metallic surge, 80s power",
    ],
    blendDuration: 8, // Smooth transitions for seamless energy spike visuals
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
    "adventurous flythrough, graceful camera movement, floating through " +
    "gothic castle interior, stained glass windows in purple and cyan, " +
    "crystal chandeliers passing overhead, candlelight and magical orbs, " +
    "stone arches sweeping past, mystical atmosphere, magenta light beams, " +
    "sanctuary exploration, ethereal mist swirling",
  styleModifiers: [
    "dramatic lighting",
    "gothic architecture",
    "magical realism",
    "high definition",
    "intricate details",
  ],
  negativePrompt: "modern, outdoor, daylight, minimalist",

  ranges: {
    denoisingSteps: { min: [800, 500], max: [1000, 800, 600, 400] },
    noiseScale: { min: 0.48, max: 0.65 }, // Higher floor for more evolution
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
      action: "pulse_noise", // Changed from transition_trigger - beats only affect noise now
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
    blendDuration: 8, // Smooth transitions for seamless energy spike visuals
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

// NOTE: All beat responses now result in noise boosts only (no prompt changes or cache resets)
// The action field is preserved for type compatibility but all are treated as pulse_noise
const BEAT_RESPONSE_MAP: Record<
  BeatResponse,
  { enabled: boolean; action: Theme["mappings"]["beats"]["action"]; intensity: number }
> = {
  none: { enabled: false, action: "pulse_noise", intensity: 0 },
  pulse: { enabled: true, action: "pulse_noise", intensity: 0.3 },
  shift: { enabled: true, action: "pulse_noise", intensity: 0.4 }, // Changed from prompt_cycle
  burst: { enabled: true, action: "pulse_noise", intensity: 0.5 }, // Changed from cache_reset (no hard cuts)
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
      noiseScale: { min: 0.5, max: 0.7 }, // Higher floor for more evolution
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
