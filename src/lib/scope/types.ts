/**
 * Scope API Types
 * Based on Daydream Scope API documentation
 */

// Pipeline configuration
export interface PipelineConfig {
  id: string;
  name: string;
  model: string;
  width: number;
  height: number;
}

// VACE (Video Anything Concept Engine) configuration
export interface VaceConfig {
  enabled: boolean;
  scale: number;
  referenceImages: string[]; // Base64 or URLs
}

// Stream configuration for real-time generation
export interface StreamConfig {
  prompt: string;
  negativePrompt?: string;
  width?: number;
  height?: number;
  seed?: number;
  guidanceScale?: number;
  numInferenceSteps?: number;
  vace?: VaceConfig;
}

// Stream status response
export interface StreamStatus {
  id: string;
  status: "idle" | "starting" | "running" | "stopping" | "error";
  fps?: number;
  bitrate?: number;
  error?: string;
}

// API health check response
export interface HealthResponse {
  status: "ok" | "error";
  version?: string;
  gpu?: string;
  vram?: string;
}

// Generation parameters (from MetaDJ Nexus experience)
export interface GenerationParams {
  prompt: string;
  negativePrompt: string;
  width: number;
  height: number;
  seed: number;
  guidanceScale: number;
  numInferenceSteps: number;
  delta: number;
  tIndexList: number[];
}

// MetaDJ Avatar specific config
export interface AvatarConfig {
  // Reference image for VACE (MetaDJ avatar base)
  referenceImage?: string;
  // Prompt template for avatar generation
  promptTemplate: string;
  // Style modifiers
  styleModifiers: string[];
  // VACE scale for identity preservation
  vaceScale: number;
}

// Default avatar configuration
export const DEFAULT_AVATAR_CONFIG: AvatarConfig = {
  promptTemplate: "A digital avatar of MetaDJ, cyberpunk style, neon lighting, futuristic DJ",
  styleModifiers: [
    "high quality",
    "detailed",
    "digital art",
    "cyberpunk aesthetic",
  ],
  vaceScale: 0.75,
};

// Default generation parameters (from Nexus production)
export const DEFAULT_GENERATION_PARAMS: Partial<GenerationParams> = {
  width: 512,
  height: 512,
  numInferenceSteps: 25,
  guidanceScale: 1.0,
  delta: 0.7,
  seed: 42,
  negativePrompt: "blurry, low quality, distorted, ugly, deformed",
};
