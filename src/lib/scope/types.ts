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
  // Maps to vace_context_scale (range 0.0-2.0)
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
  vaceScale: 1.5,
};

// Default generation parameters (from Nexus production)
export const DEFAULT_GENERATION_PARAMS: Partial<GenerationParams> = {
  width: 320,
  height: 576,
  numInferenceSteps: 25,
  guidanceScale: 1.0,
  delta: 0.7,
  seed: 42,
  negativePrompt: "blurry, low quality, distorted, ugly, deformed",
};

// Pipeline status values returned by Scope API
export type PipelineStatus = "idle" | "loading" | "loaded" | "error" | "unloading";

export interface PipelineStatusResponse {
  status: PipelineStatus;
  error?: string;
}

export interface PipelineSchemasResponse {
  schemas?: Record<string, unknown>;
}

export interface IceServersResponse {
  iceServers: RTCIceServer[];
}

export interface WebRtcOfferRequest {
  sdp: string;
  type: RTCSdpType;
  initialParameters?: Record<string, unknown>;
}

export interface WebRtcOfferResponse {
  sessionId: string;
  sdp: string;
  type: RTCSdpType;
}

export interface IceCandidatePayload {
  candidate: string | undefined;
  sdpMid: string | null;
  sdpMLineIndex: number | null;
}
