# MetaDJ Soundscape — MVP Specification

**Last Modified**: 2026-01-04 15:05 EST
**Status**: MVP Implementation Complete
**Version**: 0.4.0

---

## Implementation Status

| Component | Status | Notes |
|-----------|--------|-------|
| **Type System** | ✅ Complete | All types defined in `src/lib/soundscape/types.ts` |
| **Audio Analysis** | ✅ Complete | Meyda integration, beat detection, feature history |
| **Mapping Engine** | ✅ Complete | Theme-driven parameter mapping with curves |
| **Theme Presets** | ✅ Complete | 5 themes (Cosmic Voyage, Neon Foundry, Digital Forest, Synthwave Highway, Crystal Sanctuary) |
| **WebRTC Connection** | ✅ Complete | Full offer/answer flow with ICE negotiation |
| **DataChannel** | ✅ Complete | Rate-limited parameter updates (30Hz) |
| **UI Components** | ✅ Complete | SoundscapeStudio, AudioPlayer, ThemeSelector, AnalysisMeter, AspectRatioToggle |
| **Audio Input Modes** | ✅ Complete | Demo track, file upload, microphone input |
| **Demo Track** | ✅ Complete | "Metaversal Odyssey" bundled at `/public/audio/` |
| **Aspect Ratio Toggle** | ✅ Complete | 16:9 widescreen / 9:16 portrait |
| **Silence Detection** | ⏳ Pending | Not yet implemented |
| **State Persistence** | ⏳ Pending | localStorage for theme history |
| **Test Suite** | 🟡 Partial | Mapping engine tests in place; audio analysis + hook tests pending |

**Quick Start**: See README.md for setup instructions.

---

## Executive Summary

**MetaDJ Soundscape** is a music-reactive AI visual generation application built on Daydream Scope. Users feed music into the system, select or create visual themes, and the application dynamically modulates Scope's generation parameters based on real-time audio analysis—creating unique visual storytelling for each track.

**Vision**: Transform any song into a personalized visual journey that responds to the music's energy, rhythm, and character.

**MVP Scope**: Single-track playback with preset themes + custom theme creation, real-time audio-reactive parameter modulation, and smooth visual transitions.

**Future Direction**: This is the foundation for a broader creative platform—future iterations could include DJ mixing mode, live microphone input, collaborative theme sharing, and integration with MetaDJ's live performance tools.

---

## Infrastructure

### RunPod Configuration

Soundscape runs on a dedicated RunPod GPU instance with ample VRAM for smooth real-time generation:

| Property | Value |
|----------|-------|
| **GPU** | NVIDIA RTX Pro 6000 |
| **VRAM** | 96GB |
| **Pod ID** | `t68d6nv3pi7uia` |
| **Cost** | ~$1.84/hour |
| **Scope UI** | `https://t68d6nv3pi7uia-8000.proxy.runpod.net` |
| **API Endpoint** | `https://t68d6nv3pi7uia-8000.proxy.runpod.net` |

**Note**: Pod is not always running. Start via RunPod dashboard before development/demo sessions.

### Pipeline Selection

**Recommended Pipeline: `longlive`**

| Pipeline | Resolution | FPS | Notes |
|----------|------------|-----|-------|
| **`longlive`** (default) | 320×576 → 576×1024 | ~8 FPS | VACE support, smooth prompt transitions, best for music reactivity |
| `streamdiffusionv2` | 512×512 | ~12-15 FPS | Higher FPS but square aspect only, no VACE |
| `krea-realtime-video` | 512×512 | ~6-8 FPS | Video-to-video, requires 32GB+ VRAM |

**Why `longlive`**:
- **VACE support**: Can incorporate reference images (MetaDJ avatar) for consistent style
- **Smooth transitions**: Built-in `transition` API for seamless prompt changes (critical for music reactivity)
- **16:9 widescreen**: Native support for landscape orientation
- **Quality balance**: Prioritizes visual coherence over raw FPS

### Resolution Configuration

**Default: 16:9 Widescreen (Landscape)**
- Output: **576×1024** (9:16 generation upscaled/rotated to 16:9 display)
- Optimal for: Desktop viewing, YouTube content, streaming overlays
- Training resolution optimized variant: **1024×576** if native landscape available

**Toggle: 9:16 Portrait**
- Output: **480×832** (training resolution for best quality) or **576×1024**
- Optimal for: TikTok/Reels, mobile viewing, vertical displays

**UI Implementation**:
```typescript
interface AspectRatioConfig {
  mode: '16:9' | '9:16';
  resolution: {
    width: number;
    height: number;
  };
}

const ASPECT_PRESETS: Record<string, AspectRatioConfig> = {
  'widescreen': { mode: '16:9', resolution: { width: 1024, height: 576 } },
  'portrait': { mode: '9:16', resolution: { width: 480, height: 832 } },
};
```

**Aspect Ratio Toggle**: A simple UI toggle allows switching between widescreen (default) and portrait modes. The video display container adjusts automatically, and the Scope pipeline receives the appropriate resolution parameters.

---

## Product Context

### The Problem

Current AI video generation tools are static—you write a prompt, you get output. There's no dynamic relationship between audio and visual. Musicians, VJs, and creators want visuals that *feel* the music, not just accompany it.

### The Solution

Soundscape bridges audio and AI generation:
1. **Analyze** music in real-time (energy, brightness, rhythm, beats)
2. **Map** audio features to Scope parameters through a theme system
3. **Generate** visuals that dance with the music

### Target Users (MVP)

- **Music Creators**: Artists wanting visual content for their tracks
- **Content Creators**: YouTubers, streamers needing reactive backgrounds
- **MetaDJ Community**: Fans exploring the MetaDJ aesthetic
- **Z (Internal)**: Tool for creating MetaDJ visual content

---

## Technical Architecture

### System Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                        MetaDJ Soundscape                         │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌──────────────┐    ┌──────────────────┐    ┌──────────────┐  │
│  │ Audio Input  │───▶│  Audio Analyzer  │───▶│   Features   │  │
│  │  (Track)     │    │  (Meyda + BPM)   │    │    Buffer    │  │
│  └──────────────┘    └──────────────────┘    └──────┬───────┘  │
│                                                      │          │
│  ┌──────────────┐    ┌──────────────────┐           │          │
│  │Theme System  │───▶│  Mapping Engine  │◀──────────┘          │
│  │  (Presets +  │    │  (Audio→Params)  │                      │
│  │   Custom)    │    └────────┬─────────┘                      │
│  └──────────────┘             │                                 │
│                               ▼                                 │
│                    ┌──────────────────┐    ┌──────────────┐    │
│                    │ Parameter Queue  │───▶│    Scope     │    │
│                    │  (Smoothing)     │    │  (WebRTC)    │    │
│                    └──────────────────┘    └──────────────┘    │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

### Core Components

#### 1. Audio Input Layer
- **Source**: HTML5 `<audio>` element for file playback
- **Routing**: Web Audio API `AudioContext` + `MediaElementSource`
- **Future**: Microphone input, streaming sources

**Supported Formats (MVP)**:
| Format | Support | Notes |
|--------|---------|-------|
| MP3 | Primary | Universal browser support |
| WAV | Primary | Uncompressed, larger files |
| OGG | Secondary | Chrome/Firefox, not Safari |
| AAC/M4A | Secondary | Safari-preferred |
| FLAC | Deferred | Limited browser support |

**Constraints**:
- Max file size: 50MB (prevents memory issues)
- Sample rate: Auto-normalized to 44.1kHz by Web Audio API
- Channels: Stereo mixed to mono for analysis

**Browser Audio Policy**:
AudioContext must be created after user interaction (click/tap). The UI should show a "Start" button that initializes the audio system on first interaction.

#### 2. Audio Analyzer
**Primary Library**: [Meyda.js](https://meyda.js.org/) for feature extraction

| Feature | Use Case | Update Rate |
|---------|----------|-------------|
| `rms` | Overall energy/loudness | Per frame (~60Hz) |
| `spectralCentroid` | Brightness/mood | Per frame |
| `spectralFlatness` | Noisiness/texture | Per frame |
| `spectralRolloff` | High frequency content | Per frame |
| `zcr` | Percussiveness | Per frame |

**Secondary Library**: [Realtime BPM Analyzer](https://github.com/dlepaux/realtime-bpm-analyzer) for tempo detection

| Feature | Use Case | Update Rate |
|---------|----------|-------------|
| `bpm` | Tempo-synced transitions | On stabilization |
| `beat` | Beat-triggered events | Per beat |

**Audio Node Chain** (single source, parallel analysis):
```
                                    ┌─────────────────┐
                                    │   Meyda         │
                            ┌──────▶│   Analyzer      │
┌─────────┐   ┌──────────┐  │       └─────────────────┘
│ <audio> │──▶│ Splitter │──┤
│ element │   │ Node     │  │       ┌─────────────────┐
└─────────┘   └──────────┘  │       │   BPM Analyzer  │
                            ├──────▶│   (Low-pass)    │
                            │       └─────────────────┘
                            │
                            │       ┌─────────────────┐
                            └──────▶│   Destination   │
                                    │   (Speakers)    │
                                    └─────────────────┘
```

**Edge Cases**:
- **No clear beat**: If BPM confidence stays below 0.5 for 10+ seconds, disable beat-triggered effects and rely on energy-based reactivity only
- **Variable BPM**: Track BPM changes; if variance exceeds ±10%, switch to energy-only mode
- **Silence detection**: If RMS stays below 0.01 for 2+ seconds, reduce visual intensity gradually

#### 3. Feature Buffer
Maintains rolling history for:
- **Smoothing**: Avoid jittery visuals from frame-to-frame variation
- **Derivative Calculation**: Detect energy *changes* (drops, builds)
- **Section Detection**: Identify verse/chorus/drop transitions

```typescript
interface FeatureBuffer {
  rms: RingBuffer<number>;           // Last 60 frames (~1 second)
  spectralCentroid: RingBuffer<number>;
  energy: {
    current: number;
    average: number;
    derivative: number;              // Rate of change
    peak: number;                    // Recent maximum
  };
  beat: {
    bpm: number | null;
    lastBeatTime: number;
    confidence: number;
  };
}
```

#### 4. Theme System

A theme defines:
1. **Base visual identity** (prompts, style)
2. **Parameter ranges** (boundaries for modulation)
3. **Mapping configuration** (which audio features affect which parameters)

```typescript
interface Theme {
  id: string;
  name: string;
  description: string;

  // Visual Foundation
  basePrompt: string;
  styleModifiers: string[];
  negativePrompt: string;

  // Parameter Ranges (used for runtime mapping where enabled)
  ranges: {
    denoisingSteps: { min: number[]; max: number[] };  // Reserved: fixed 4-step schedule used in engine
    noiseScale: { min: number; max: number };          // 0.0 to 1.0
    vaceScale: { min: number; max: number };           // 0.0 to 2.0
    transitionSpeed: { min: number; max: number };     // Frames for prompt transitions
  };

  // Mapping Configuration
  mappings: {
    energy: MappingTarget[];      // What RMS affects
    brightness: MappingTarget[];  // What spectral centroid affects
    texture: MappingTarget[];     // What spectral flatness affects
    beats: BeatMapping;           // What happens on beats
  };

  // Prompt Variations (for beat-triggered or section changes)
  promptVariations?: {
    trigger: 'beat' | 'energy_spike' | 'section';
    prompts: string[];
    blendDuration: number;        // Frames to blend
  };
}

interface MappingTarget {
  parameter: 'noiseScale' | 'denoisingSteps' | 'vaceScale' | 'promptWeight';
  curve: 'linear' | 'exponential' | 'logarithmic' | 'stepped';
  sensitivity: number;            // 0.0 to 2.0 multiplier
  invert: boolean;
}

interface BeatMapping {
  enabled: boolean;
  action: 'pulse_noise' | 'prompt_cycle' | 'cache_reset' | 'transition_trigger';
  intensity: number;
  cooldownMs?: number;  // Minimum time between triggers (default: 200ms)
}

**Note**: Soundscape uses a fixed 4-step denoising schedule; per-theme denoising ranges are reserved for future tuning.

// Beat handler with cooldown to prevent visual stuttering
class BeatHandler {
  private lastTriggerTime = 0;

  shouldTrigger(mapping: BeatMapping): boolean {
    const now = Date.now();
    const cooldown = mapping.cooldownMs || 200;

    // For cache_reset, enforce longer cooldown (expensive operation)
    const effectiveCooldown = mapping.action === 'cache_reset' ? Math.max(cooldown, 500) : cooldown;

    if (now - this.lastTriggerTime < effectiveCooldown) return false;
    this.lastTriggerTime = now;
    return true;
  }
}
```

#### 5. Mapping Engine

The core intelligence translating audio to visuals:

```typescript
class MappingEngine {
  private theme: Theme;
  private featureBuffer: FeatureBuffer;
  private lastParams: ScopeParameters;
  private normalizationConfig: NormalizationConfig;
  private fixedDenoisingSteps = [1000, 750, 500, 250];

  computeParameters(): ScopeParameters {
    const features = this.featureBuffer;
    const t = this.theme;

    // Normalize features to 0-1 range using configurable ranges
    const normalizedEnergy = this.normalize(
      features.energy.current,
      0,
      features.energy.peak || this.normalizationConfig.energyMax
    );
    const normalizedBrightness = this.normalize(
      features.spectralCentroid.current,
      this.normalizationConfig.spectralCentroidMin,  // Default: 200 Hz
      this.normalizationConfig.spectralCentroidMax   // Default: 8000 Hz
    );

    // Apply mappings with curve functions
    let noiseScale = t.ranges.noiseScale.min;
    for (const mapping of t.mappings.energy) {
      if (mapping.parameter === 'noiseScale') {
        noiseScale = this.applyMapping(normalizedEnergy, t.ranges.noiseScale, mapping);
      }
    }

    // Smooth transitions
    return this.smooth(this.lastParams, {
      noiseScale,
      denoisingSteps: this.fixedDenoisingSteps,
      prompts: this.computePrompts(features),
    });
  }

  // Curve function implementations
  private applyMapping(value: number, range: { min: number; max: number }, mapping: MappingTarget): number {
    const scaled = mapping.invert ? 1 - value : value;
    const curved = this.applyCurve(scaled * mapping.sensitivity, mapping.curve);
    const clamped = Math.max(0, Math.min(1, curved));
    return range.min + (range.max - range.min) * clamped;
  }

  private applyCurve(value: number, curve: string): number {
    switch (curve) {
      case 'exponential': return Math.pow(value, 2);        // More response at high end
      case 'logarithmic': return Math.sqrt(value);          // More response at low end
      case 'stepped': return Math.floor(value * 4) / 4;     // Quantized to 4 levels
      default: return value;                                 // Linear
    }
  }

  // Denoising steps are fixed for Soundscape (4-step schedule).
}

// Normalization configuration (can be per-theme or global)
interface NormalizationConfig {
  energyMax: number;              // Default: 0.5 (auto-calibrates)
  spectralCentroidMin: number;    // Default: 200 Hz
  spectralCentroidMax: number;    // Default: 8000 Hz
  spectralFlatnessMax: number;    // Default: 0.5
}

const DEFAULT_NORMALIZATION: NormalizationConfig = {
  energyMax: 0.5,
  spectralCentroidMin: 200,
  spectralCentroidMax: 8000,
  spectralFlatnessMax: 0.5,
};
```

#### 6. Parameter Queue + Smoothing

Prevents jarring visual changes:

```typescript
class ParameterSmoother {
  private smoothingFactor = 0.15;  // Lower = smoother, slower response
  private lastSent: ScopeParameters;

  smooth(target: ScopeParameters): ScopeParameters {
    return {
      noiseScale: this.lerp(this.lastSent.noiseScale, target.noiseScale),
      // Denoising steps change discretely, not smoothly
      denoisingSteps: this.shouldUpdateSteps(target) ? target.denoisingSteps : this.lastSent.denoisingSteps,
      // Prompts use Scope's built-in transition system
      transition: target.promptChanged ? {
        target_prompts: target.prompts,
        num_steps: 8,
        temporal_interpolation_method: 'slerp'
      } : undefined
    };
  }
}
```

#### 7. Scope Integration (End-to-End Video Pipeline)

This section details the complete pipeline from Scope server to rendered video in our custom UI.

##### 7.1 WebRTC Connection Architecture

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                     SOUNDSCAPE ↔ SCOPE CONNECTION                           │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │                          BROWSER (Soundscape)                        │   │
│  │                                                                       │   │
│  │  ┌─────────────┐     ┌──────────────────┐     ┌─────────────────┐   │   │
│  │  │   Audio     │────▶│  Mapping Engine  │────▶│  Parameter      │   │   │
│  │  │   Analyzer  │     │  (30Hz updates)  │     │  Smoother       │   │   │
│  │  └─────────────┘     └──────────────────┘     └────────┬────────┘   │   │
│  │                                                         │            │   │
│  │                                               ┌─────────▼─────────┐ │   │
│  │  ┌─────────────┐     ┌──────────────────┐     │   DataChannel     │ │   │
│  │  │   <video>   │◀────│   MediaStream    │◀────│   (parameters)    │ │   │
│  │  │   element   │     │   (from ontrack) │     └─────────┬─────────┘ │   │
│  │  └─────────────┘     └──────────────────┘               │           │   │
│  │                                                         │           │   │
│  │                            ┌────────────────────────────┘           │   │
│  │                            │                                        │   │
│  │                 ┌──────────▼──────────┐                             │   │
│  │                 │  RTCPeerConnection  │                             │   │
│  │                 │  (ICE + DTLS + RTP) │                             │   │
│  │                 └──────────┬──────────┘                             │   │
│  └────────────────────────────┼────────────────────────────────────────┘   │
│                               │                                             │
│  ═══════════════════════════════════════════════════════════════════════   │
│                          WebRTC (UDP/TURN)                                  │
│  ═══════════════════════════════════════════════════════════════════════   │
│                               │                                             │
│  ┌────────────────────────────▼────────────────────────────────────────┐   │
│  │                      SCOPE SERVER (RunPod GPU)                       │   │
│  │                                                                       │   │
│  │  ┌─────────────────┐     ┌─────────────────┐     ┌───────────────┐  │   │
│  │  │ DataChannel Rx  │────▶│  StreamDiffusion │────▶│  Video Encoder │ │   │
│  │  │ (JSON params)   │     │  Pipeline        │     │  (VP8/H.264)   │ │   │
│  │  └─────────────────┘     │  (LongLive)      │     └───────────────┘ │   │
│  │                          └─────────────────┘                         │   │
│  └──────────────────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────────────────┘
```

##### 7.2 Connection Lifecycle Manager

```typescript
class ScopeConnectionManager {
  private client: ScopeClient;
  private peerConnection: RTCPeerConnection | null = null;
  private dataChannel: RTCDataChannel | null = null;
  private sessionId: string | null = null;
  private videoStream: MediaStream | null = null;

  // Connection state
  private connectionState: 'disconnected' | 'connecting' | 'connected' | 'reconnecting' = 'disconnected';
  private reconnectAttempts = 0;
  private readonly maxReconnectAttempts = 3;
  private readonly reconnectDelayMs = 2000;

  // Event callbacks
  onVideoStream?: (stream: MediaStream) => void;
  onConnectionStateChange?: (state: typeof this.connectionState) => void;
  onError?: (error: Error) => void;
  onStats?: (stats: ConnectionStats) => void;

  async connect(initialParams: ScopeParameters): Promise<void> {
    this.setConnectionState('connecting');

    try {
      // Step 1: Verify pipeline is loaded
      await this.ensurePipelineReady();

      // Step 2: Get ICE servers (includes TURN for NAT traversal)
      const iceServers = await this.client.getIceServers();
      if (!iceServers) throw new Error('Failed to get ICE servers');

      // Step 3: Create RTCPeerConnection
      this.peerConnection = new RTCPeerConnection({
        iceServers: iceServers.iceServers,
        iceCandidatePoolSize: 10,  // Pre-gather candidates
      });

      // Step 4: Set up video receiver (CRITICAL: must call BEFORE createOffer)
      this.peerConnection.addTransceiver('video', { direction: 'recvonly' });

      // Step 5: Handle incoming video track
      this.peerConnection.ontrack = (event) => {
        if (event.streams?.[0]) {
          this.videoStream = event.streams[0];
          this.onVideoStream?.(this.videoStream);
        }
      };

      // Step 6: Create data channel for parameter updates
      this.dataChannel = this.peerConnection.createDataChannel('parameters', {
        ordered: true,
        maxRetransmits: 3,
      });

      this.dataChannel.onopen = () => {
        this.setConnectionState('connected');
        this.reconnectAttempts = 0;
      };

      this.dataChannel.onclose = () => this.handleDisconnect('DataChannel closed');
      this.dataChannel.onerror = (e) => this.handleError(new Error(`DataChannel error: ${e}`));

      this.dataChannel.onmessage = (event) => {
        const msg = JSON.parse(event.data);
        if (msg.type === 'stream_stopped') {
          this.handleDisconnect(msg.error_message || 'Stream stopped by server');
        }
      };

      // Step 7: Connection state monitoring
      this.peerConnection.onconnectionstatechange = () => {
        const state = this.peerConnection?.connectionState;
        if (state === 'failed' || state === 'disconnected') {
          this.handleDisconnect(`PeerConnection ${state}`);
        }
      };

      // Step 8: ICE candidate handling
      const pendingCandidates: RTCIceCandidate[] = [];
      this.peerConnection.onicecandidate = async (event) => {
        if (!event.candidate) return;
        if (this.sessionId) {
          await this.client.addIceCandidates(this.sessionId, [{
            candidate: event.candidate.candidate,
            sdpMid: event.candidate.sdpMid,
            sdpMLineIndex: event.candidate.sdpMLineIndex,
          }]);
        } else {
          pendingCandidates.push(event.candidate);
        }
      };

      // Step 9: Create and send offer
      const offer = await this.peerConnection.createOffer();
      await this.peerConnection.setLocalDescription(offer);

      const answer = await this.client.createWebRtcOffer({
        sdp: offer.sdp || '',
        type: offer.type,
        initialParameters: initialParams,
      });

      if (!answer) throw new Error('No answer from Scope server');

      this.sessionId = answer.sessionId;
      await this.peerConnection.setRemoteDescription({
        type: answer.type,
        sdp: answer.sdp,
      });

      // Step 10: Flush pending ICE candidates
      if (pendingCandidates.length > 0) {
        await this.client.addIceCandidates(
          this.sessionId,
          pendingCandidates.map(c => ({
            candidate: c.candidate,
            sdpMid: c.sdpMid,
            sdpMLineIndex: c.sdpMLineIndex,
          }))
        );
      }

      // Step 11: Start stats monitoring
      this.startStatsMonitoring();

    } catch (error) {
      this.handleError(error instanceof Error ? error : new Error(String(error)));
    }
  }

  private async handleDisconnect(reason: string): Promise<void> {
    if (this.connectionState === 'reconnecting') return;

    console.warn(`[ScopeConnection] Disconnected: ${reason}`);

    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      this.setConnectionState('reconnecting');
      this.reconnectAttempts++;

      await new Promise(r => setTimeout(r, this.reconnectDelayMs));

      // Clean up and retry
      this.cleanup();
      await this.connect(this.lastParams);
    } else {
      this.setConnectionState('disconnected');
      this.onError?.(new Error(`Connection failed after ${this.maxReconnectAttempts} attempts: ${reason}`));
    }
  }

  // Stats monitoring for connection health
  private statsInterval?: number;
  private startStatsMonitoring(): void {
    this.statsInterval = window.setInterval(async () => {
      if (!this.peerConnection) return;

      const stats = await this.peerConnection.getStats();
      let inboundVideo: RTCInboundRtpStreamStats | null = null;

      stats.forEach((report) => {
        if (report.type === 'inbound-rtp' && report.kind === 'video') {
          inboundVideo = report as RTCInboundRtpStreamStats;
        }
      });

      if (inboundVideo) {
        this.onStats?.({
          fps: inboundVideo.framesPerSecond || 0,
          framesDecoded: inboundVideo.framesDecoded || 0,
          framesDropped: inboundVideo.framesDropped || 0,
          bytesReceived: inboundVideo.bytesReceived || 0,
          packetsLost: inboundVideo.packetsLost || 0,
          jitter: inboundVideo.jitter || 0,
        });
      }
    }, 1000);
  }
}

interface ConnectionStats {
  fps: number;
  framesDecoded: number;
  framesDropped: number;
  bytesReceived: number;
  packetsLost: number;
  jitter: number;
}
```

##### 7.3 Video Display Component

```typescript
interface VideoDisplayProps {
  stream: MediaStream | null;
  connectionState: 'disconnected' | 'connecting' | 'connected' | 'reconnecting';
  stats?: ConnectionStats;
  onFullscreenToggle?: () => void;
}

function VideoDisplay({ stream, connectionState, stats, onFullscreenToggle }: VideoDisplayProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);

  // Attach stream to video element
  useEffect(() => {
    if (!videoRef.current) return;

    if (stream) {
      videoRef.current.srcObject = stream;
      // Ensure playback starts (may be blocked by autoplay policy)
      videoRef.current.play().catch(console.warn);
    } else {
      videoRef.current.srcObject = null;
    }

    return () => {
      if (videoRef.current) {
        videoRef.current.srcObject = null;
      }
    };
  }, [stream]);

  // Fullscreen API integration
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);

  const toggleFullscreen = async () => {
    if (!containerRef.current) return;

    if (!document.fullscreenElement) {
      await containerRef.current.requestFullscreen();
    } else {
      await document.exitFullscreen();
    }
    onFullscreenToggle?.();
  };

  return (
    <div ref={containerRef} className="relative bg-black">
      {/* Connection State Overlay */}
      {connectionState !== 'connected' && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/80 z-10">
          <ConnectionStateIndicator state={connectionState} />
        </div>
      )}

      {/* Video Element */}
      <video
        ref={videoRef}
        autoPlay
        playsInline
        muted  // Required for autoplay without user interaction
        className="w-full h-full object-contain"
      />

      {/* Stats Overlay (visible on hover in fullscreen) */}
      {isFullscreen && stats && (
        <div className="absolute top-4 left-4 bg-black/70 text-white text-xs p-2 rounded">
          <div>FPS: {stats.fps.toFixed(1)}</div>
          <div>Dropped: {stats.framesDropped}</div>
          <div>Jitter: {(stats.jitter * 1000).toFixed(0)}ms</div>
        </div>
      )}

      {/* Fullscreen Toggle */}
      <button
        onClick={toggleFullscreen}
        className="absolute bottom-4 right-4 bg-black/50 hover:bg-black/70 p-2 rounded"
        aria-label={isFullscreen ? 'Exit fullscreen' : 'Enter fullscreen'}
      >
        {isFullscreen ? '⛶' : '⛶'}
      </button>
    </div>
  );
}
```

##### 7.4 Parameter Sender with Rate Limiting

```typescript
class ParameterSender {
  private dataChannel: RTCDataChannel;
  private targetUpdateRate: number;  // Hz
  private lastSendTime = 0;
  private pendingParams: ScopeParameters | null = null;
  private sendScheduled = false;

  constructor(dataChannel: RTCDataChannel, updateRate = 30) {
    this.dataChannel = dataChannel;
    this.targetUpdateRate = updateRate;
  }

  /**
   * Queue parameters for sending. Rate-limited to targetUpdateRate.
   * Latest values always win if called faster than rate limit.
   */
  send(params: ScopeParameters): void {
    this.pendingParams = params;

    if (!this.sendScheduled) {
      this.scheduleNextSend();
    }
  }

  private scheduleNextSend(): void {
    const now = performance.now();
    const minInterval = 1000 / this.targetUpdateRate;
    const elapsed = now - this.lastSendTime;
    const delay = Math.max(0, minInterval - elapsed);

    this.sendScheduled = true;

    setTimeout(() => {
      this.sendScheduled = false;

      if (this.pendingParams && this.dataChannel.readyState === 'open') {
        this.dataChannel.send(JSON.stringify(this.formatParams(this.pendingParams)));
        this.lastSendTime = performance.now();
        this.pendingParams = null;
      }

      // If more params arrived while waiting, schedule again
      if (this.pendingParams) {
        this.scheduleNextSend();
      }
    }, delay);
  }

  private formatParams(params: ScopeParameters): Record<string, unknown> {
    return {
      prompts: params.prompts.map(p => ({ text: p.text, weight: p.weight })),
      denoising_step_list: params.denoisingSteps,
      noise_scale: params.noiseScale,
      noise_controller: false,  // We control noise manually based on audio
      manage_cache: true,
      ...(params.transition && { transition: params.transition }),
      ...(params.resetCache && { reset_cache: true }),
    };
  }
}
```

##### 7.5 Audio-Visual Sync Considerations

**Latency Budget Breakdown:**

```
┌─────────────────────────────────────────────────────────────────────┐
│                    TOTAL LATENCY: ~200-400ms                        │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  Audio Analysis (Meyda)           ~15ms   ████░░░░░░░░░░░░░░░░░░   │
│  Mapping Engine                    ~5ms   ██░░░░░░░░░░░░░░░░░░░░░   │
│  WebRTC DataChannel Send          ~10ms   ███░░░░░░░░░░░░░░░░░░░░   │
│  Network (local/LAN)              ~20ms   █████░░░░░░░░░░░░░░░░░░   │
│  Network (internet/TURN)         ~100ms   █████████████████████░░   │
│  StreamDiffusion Generation      ~125ms   ██████████████████████░   │
│  Video Encoding                   ~15ms   ████░░░░░░░░░░░░░░░░░░░   │
│  WebRTC Video Transport           ~30ms   ███████░░░░░░░░░░░░░░░░   │
│  Video Decode + Render            ~10ms   ███░░░░░░░░░░░░░░░░░░░░   │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

**Sync Strategy:**

```typescript
interface SyncConfig {
  // Intentional audio delay to match visual latency (ms)
  // Set to 0 if users prefer immediate audio
  audioDelayMs: number;

  // Pre-compute parameters N frames ahead
  parameterLookaheadFrames: number;

  // Smooth visual transitions over N frames to mask latency
  visualSmoothingFrames: number;
}

const DEFAULT_SYNC_CONFIG: SyncConfig = {
  audioDelayMs: 0,           // Don't delay audio (feels unnatural)
  parameterLookaheadFrames: 0,  // Real-time response (no prediction)
  visualSmoothingFrames: 4,    // Smooth over ~130ms at 30Hz
};

// Note: Perfect audio-visual sync is not achievable with 200-400ms latency.
// Design principle: Prioritize "feels reactive" over "perfectly synced".
// The visual should feel like it's dancing WITH the music, not TO the beat.
```

##### 7.6 Future: Recording & Capture

For v0.3+ video export functionality:

```typescript
interface RecordingManager {
  // MediaRecorder API for capturing the video stream
  startRecording(stream: MediaStream): void;
  stopRecording(): Promise<Blob>;

  // Canvas-based capture for overlays
  captureFrame(video: HTMLVideoElement): ImageData;

  // WebM output (Chrome) or MP4 (Safari via WebM-to-MP4 conversion)
  supportedFormats: string[];
}

// Note: Recording captures the WebRTC output stream, not the raw generation.
// Quality depends on WebRTC video codec settings (VP8/VP9/H.264).
```

---

## Theme Presets (MetaDJ Brand-Aligned)

### Preset 1: Cosmic Voyage
*The signature MetaDJ journey through digital space*

```typescript
const COSMIC_VOYAGE: Theme = {
  id: 'cosmic-voyage',
  name: 'Cosmic Voyage',
  description: 'Journey through neon-lit digital cosmos',

  basePrompt: 'cosmic digital landscape, neon purple and cyan nebula, ' +
              'floating geometric structures, ethereal light particles, ' +
              'deep space atmosphere, stars and galaxies, ' +
              'magenta energy accents, transformation journey',
  styleModifiers: ['cinematic lighting', 'depth of field', 'volumetric fog'],
  negativePrompt: 'blurry, low quality, text, watermark, human faces',

  ranges: {
    denoisingSteps: { min: [700, 400], max: [1000, 750, 500, 250] },
    noiseScale: { min: 0.3, max: 0.9 },
    vaceScale: { min: 0.5, max: 1.5 },
    transitionSpeed: { min: 4, max: 16 },
  },

  mappings: {
    energy: [
      { parameter: 'noiseScale', curve: 'exponential', sensitivity: 1.2, invert: false },
      { parameter: 'denoisingSteps', curve: 'stepped', sensitivity: 1.0, invert: true },
    ],
    brightness: [
      { parameter: 'promptWeight', curve: 'linear', sensitivity: 0.8, invert: false },
    ],
    texture: [],
    beats: {
      enabled: true,
      action: 'pulse_noise',
      intensity: 0.3,
    },
  },

  promptVariations: {
    trigger: 'energy_spike',
    prompts: [
      'cosmic explosion, supernova burst, intense neon flare',
      'wormhole opening, reality bending, dimensional rift',
    ],
    blendDuration: 8,
  },
};
```

### Preset 2: Neon Foundry
*The AI Foundry creative sanctuary*

```typescript
const NEON_FOUNDRY: Theme = {
  id: 'neon-foundry',
  name: 'Neon Foundry',
  description: 'Inside the Zuberant AI Foundry - where creation happens',

  basePrompt: 'futuristic workshop interior, glowing machinery, ' +
              'holographic displays in cyan, purple ambient lighting, ' +
              'gothic architecture meets technology, creative forge, ' +
              'magenta sparks, AI foundry aesthetic',
  styleModifiers: ['industrial aesthetic', 'dramatic shadows', 'neon accents'],
  negativePrompt: 'outdoor, nature, daylight, cartoon',

  ranges: {
    denoisingSteps: { min: [800, 500], max: [1000, 750, 500, 250] },
    noiseScale: { min: 0.4, max: 0.85 },
    vaceScale: { min: 0.8, max: 1.8 },
    transitionSpeed: { min: 6, max: 20 },
  },

  mappings: {
    energy: [
      { parameter: 'noiseScale', curve: 'linear', sensitivity: 1.0, invert: false },
    ],
    brightness: [
      { parameter: 'vaceScale', curve: 'logarithmic', sensitivity: 0.6, invert: true },
    ],
    texture: [
      { parameter: 'denoisingSteps', curve: 'stepped', sensitivity: 1.2, invert: false },
    ],
    beats: {
      enabled: true,
      action: 'cache_reset',
      intensity: 0.5,
    },
  },
};
```

### Preset 3: Digital Forest
*Nature meets technology - the fantastical worlds aesthetic*

```typescript
const DIGITAL_FOREST: Theme = {
  id: 'digital-forest',
  name: 'Digital Forest',
  description: 'Bioluminescent nature infused with technology',

  basePrompt: 'enchanted forest at night, bioluminescent plants, ' +
              'floating particles, cyan and magenta glow, ' +
              'mystical atmosphere, tech-organic fusion, ' +
              'purple shadows, digital nature harmony',
  styleModifiers: ['magical realism', 'soft glow', 'ethereal'],
  negativePrompt: 'urban, concrete, harsh lighting, realistic',

  ranges: {
    denoisingSteps: { min: [750, 450], max: [1000, 750, 500, 250] },
    noiseScale: { min: 0.35, max: 0.8 },
    vaceScale: { min: 0.6, max: 1.4 },
    transitionSpeed: { min: 8, max: 24 },
  },

  mappings: {
    energy: [
      { parameter: 'noiseScale', curve: 'logarithmic', sensitivity: 0.9, invert: false },
    ],
    brightness: [
      { parameter: 'promptWeight', curve: 'linear', sensitivity: 1.1, invert: false },
    ],
    texture: [
      { parameter: 'vaceScale', curve: 'linear', sensitivity: 0.7, invert: false },
    ],
    beats: {
      enabled: true,
      action: 'prompt_cycle',
      intensity: 0.4,
    },
  },

  promptVariations: {
    trigger: 'beat',
    prompts: [
      'fireflies swarm, particles dance, energy surge',
      'aurora appears, light ribbons flow, magical pulse',
    ],
    blendDuration: 12,
  },
};
```

### Preset 4: Synthwave Highway
*80s retro-futurism in motion*

```typescript
const SYNTHWAVE_HIGHWAY: Theme = {
  id: 'synthwave-highway',
  name: 'Synthwave Highway',
  description: '80s retro-futuristic endless drive',

  basePrompt: 'synthwave landscape, neon grid highway, ' +
              'sunset gradient sky in purple and magenta, palm trees silhouette, ' +
              'retro sports car, vaporwave aesthetic, cyan accent lights',
  styleModifiers: ['80s aesthetic', 'chromatic aberration', 'scan lines'],
  negativePrompt: 'modern, realistic, daytime, cloudy',

  ranges: {
    denoisingSteps: { min: [700, 400], max: [950, 700, 450] },
    noiseScale: { min: 0.4, max: 0.95 },
    vaceScale: { min: 0.4, max: 1.2 },
    transitionSpeed: { min: 4, max: 12 },
  },

  mappings: {
    energy: [
      { parameter: 'noiseScale', curve: 'exponential', sensitivity: 1.4, invert: false },
      { parameter: 'denoisingSteps', curve: 'stepped', sensitivity: 1.0, invert: true },
    ],
    brightness: [],
    texture: [
      { parameter: 'vaceScale', curve: 'linear', sensitivity: 0.5, invert: true },
    ],
    beats: {
      enabled: true,
      action: 'pulse_noise',
      intensity: 0.5,
    },
  },
};
```

### Preset 5: Crystal Sanctuary
*The gothic castle interior - MetaDJ's creative home*

```typescript
const CRYSTAL_SANCTUARY: Theme = {
  id: 'crystal-sanctuary',
  name: 'Crystal Sanctuary',
  description: 'Inside the gothic castle where transformation happens',

  basePrompt: 'gothic castle interior, stained glass windows in purple and cyan, ' +
              'crystal chandeliers, candlelight and magical orbs, ' +
              'stone arches, mystical atmosphere, magenta light beams, ' +
              'sanctuary of creation, ethereal mist',
  styleModifiers: ['dramatic lighting', 'gothic architecture', 'magical realism'],
  negativePrompt: 'modern, outdoor, daylight, minimalist',

  ranges: {
    denoisingSteps: { min: [800, 500], max: [1000, 750, 500, 250] },
    noiseScale: { min: 0.35, max: 0.8 },
    vaceScale: { min: 0.7, max: 1.6 },
    transitionSpeed: { min: 8, max: 20 },
  },

  mappings: {
    energy: [
      { parameter: 'noiseScale', curve: 'logarithmic', sensitivity: 1.0, invert: false },
    ],
    brightness: [
      { parameter: 'vaceScale', curve: 'linear', sensitivity: 0.8, invert: false },
      { parameter: 'promptWeight', curve: 'linear', sensitivity: 0.6, invert: false },
    ],
    texture: [
      { parameter: 'denoisingSteps', curve: 'stepped', sensitivity: 0.8, invert: false },
    ],
    beats: {
      enabled: true,
      action: 'transition_trigger',
      intensity: 0.4,
      cooldownMs: 400,
    },
  },

  promptVariations: {
    trigger: 'energy_spike',
    prompts: [
      'magical energy surge, crystals illuminate, power awakening',
      'stained glass transforms, light dances, sanctuary pulses',
    ],
    blendDuration: 10,
  },
};
```

### Custom Theme Creation

Users can create themes on-the-fly with a simplified interface:

```typescript
interface CustomThemeInput {
  // Required: What do you want to see?
  prompt: string;

  // Optional: Style modifiers (suggestions provided)
  style?: string[];

  // Optional: Reactivity preset
  reactivity?: 'subtle' | 'balanced' | 'intense' | 'chaotic';

  // Optional: Beat behavior
  beatResponse?: 'none' | 'pulse' | 'shift' | 'burst';
}

function createCustomTheme(input: CustomThemeInput): Theme {
  const reactivityPresets = {
    subtle: { noiseSensitivity: 0.5, stepsSensitivity: 0.3 },
    balanced: { noiseSensitivity: 1.0, stepsSensitivity: 0.7 },
    intense: { noiseSensitivity: 1.5, stepsSensitivity: 1.2 },
    chaotic: { noiseSensitivity: 2.0, stepsSensitivity: 1.5 },
  };

  const preset = reactivityPresets[input.reactivity || 'balanced'];

  return {
    id: `custom-${Date.now()}`,
    name: 'Custom Theme',
    description: input.prompt.slice(0, 50) + '...',
    basePrompt: input.prompt,
    styleModifiers: input.style || ['high quality', 'detailed'],
    negativePrompt: 'blurry, low quality, distorted',
    ranges: {
      denoisingSteps: { min: [700, 400], max: [1000, 750, 500, 250] },
      noiseScale: { min: 0.3, max: 0.9 },
      vaceScale: { min: 0.5, max: 1.5 },
      transitionSpeed: { min: 4, max: 16 },
    },
    mappings: {
      energy: [
        { parameter: 'noiseScale', curve: 'exponential', sensitivity: preset.noiseSensitivity, invert: false },
        { parameter: 'denoisingSteps', curve: 'stepped', sensitivity: preset.stepsSensitivity, invert: true },
      ],
      brightness: [
        { parameter: 'promptWeight', curve: 'linear', sensitivity: 0.8, invert: false },
      ],
      texture: [],
      beats: {
        enabled: input.beatResponse !== 'none',
        action: input.beatResponse === 'shift' ? 'prompt_cycle' :
                input.beatResponse === 'burst' ? 'cache_reset' : 'pulse_noise',
        intensity: input.beatResponse === 'burst' ? 0.6 : 0.3,
      },
    },
  };
}
```

---

## User Interface (MVP)

### Layout

```
┌─────────────────────────────────────────────────────────────────┐
│  MetaDJ Soundscape                       [⛶ Fullscreen] [⚙] [?]│
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌─────────────────────────────────────────────────────────┐    │
│  │                                                         │    │
│  │                   VIDEO OUTPUT                          │    │
│  │                   (Scope Stream)                        │    │
│  │                                               [⛶]       │    │
│  │                                                         │    │
│  └─────────────────────────────────────────────────────────┘    │
│                                                                  │
│  ┌──────────────────────┐  ┌────────────────────────────────┐   │
│  │ ▶ Now Playing        │  │ Theme: Cosmic Voyage           │   │
│  │ track-name.mp3       │  │                                │   │
│  │ ▬▬▬▬▬▬▬▬▬▬▬▬○─────── │  │ [Cosmic] [Foundry] [Forest]   │   │
│  │ 1:23 / 4:56   🔊──── │  │ [Synthwave] [Sanctuary]        │   │
│  └──────────────────────┘  │ [+ Custom]                     │   │
│                            └────────────────────────────────┘   │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │ Audio Analysis                    │ Parameter Output      │   │
│  │ Energy:    ▓▓▓▓▓▓▓▓░░░░ 68%      │ Noise:     0.62       │   │
│  │ Brightness:▓▓▓▓▓░░░░░░░ 42%      │ Steps:     [800,500]  │   │
│  │ BPM:       128 (stable)          │ VACE:      1.2        │   │
│  │ Beat:      ● ○ ○ ○               │ Cache:     managed    │   │
│  └──────────────────────────────────────────────────────────┘   │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

**Fullscreen Mode**:
- Video output can enter browser fullscreen (Fullscreen API)
- Controls overlay appears on hover/tap
- ESC or click to exit
- Audio analysis meters visible in mini-overlay

### Core Interactions

1. **Load Track**: Drag & drop or file picker
2. **Select Theme**: Click preset buttons or "Custom"
3. **Custom Theme Modal**:
   - Text input for prompt
   - Style tag toggles
   - Reactivity slider (subtle → chaotic)
   - Beat response dropdown
4. **Playback Controls**: Play/pause, seek, volume
5. **Live Adjustments**:
   - Reactivity slider (override theme sensitivity)
   - Manual noise override (slider)
   - Pause analysis toggle

### Custom Theme Modal

```
┌────────────────────────────────────────────────────────┐
│  Create Custom Theme                              [X]  │
├────────────────────────────────────────────────────────┤
│                                                        │
│  What do you want to see?                              │
│  ┌──────────────────────────────────────────────────┐  │
│  │ underwater city with bioluminescent jellyfish,  │  │
│  │ ancient ruins, flowing currents                  │  │
│  └──────────────────────────────────────────────────┘  │
│                                                        │
│  Style (click to add):                                 │
│  [cinematic] [dreamy] [dark] [vibrant] [minimal]       │
│  [abstract] [geometric] [organic] [glitch]             │
│                                                        │
│  Reactivity:                                           │
│  subtle ○──────●──────○──────○ chaotic                 │
│                    balanced                            │
│                                                        │
│  Beat Response:                                        │
│  [None] [Pulse ●] [Shift] [Burst]                      │
│                                                        │
│                            [Cancel]  [Create Theme]    │
└────────────────────────────────────────────────────────┘
```

---

## Technical Implementation Plan

### Phase 1: Foundation (Week 1)

**Goal**: Audio analysis working, basic Scope parameter control

1. **Audio Pipeline Setup**
   - Integrate Meyda.js into Next.js project
   - Create AudioContext management hook
   - Implement file upload → audio element → analyzer chain

2. **Feature Extraction Service**
   - Real-time Meyda analysis at 60Hz
   - Feature buffer with rolling history
   - Normalization utilities

3. **Basic Scope Integration**
   - Extend existing WebRTC setup
   - Parameter sending at 30Hz
   - Simple energy → noise_scale mapping (proof of concept)

**Deliverable**: Play a track, see noise_scale respond to loudness

### Phase 2: Mapping Engine (Week 2)

**Goal**: Theme system working with configurable mappings

1. **Theme Data Model**
   - TypeScript interfaces
   - 4 preset themes defined
   - Theme storage (localStorage for custom)

2. **Mapping Engine Core**
   - Multi-feature → multi-parameter mapping
   - Curve functions (linear, exponential, logarithmic)
   - Sensitivity scaling

3. **Parameter Smoothing**
   - Interpolation for continuous parameters
   - Discrete step changes for denoising steps
   - Scope transition API for prompt changes

**Deliverable**: Switch between themes, see different visual responses

### Phase 3: Beat Detection (Week 3)

**Goal**: BPM detection and beat-synced events

1. **BPM Analyzer Integration**
   - Add realtime-bpm-analyzer
   - Merge with Meyda pipeline
   - Beat event emission

2. **Beat-Triggered Actions**
   - Noise pulse on beat
   - Prompt cycling on beat
   - Cache reset on energy spikes

3. **Section Awareness (Basic)**
   - Energy derivative tracking
   - Build/drop detection
   - Intensity multiplier adjustments

**Deliverable**: Visuals pulse on beats, respond to drops

### Phase 4: UI Polish (Week 4)

**Goal**: Usable interface with custom theme creation

1. **UI Implementation**
   - Video output display
   - Audio controls (play, seek, volume)
   - Theme selector
   - Analysis visualization

2. **Custom Theme Modal**
   - Prompt input
   - Style toggles
   - Reactivity/beat controls
   - Theme preview

3. **Quality of Life**
   - Drag & drop file loading
   - Keyboard shortcuts
   - Error handling and status display

**Deliverable**: Complete MVP ready for testing

---

## Dependencies

### Runtime Dependencies

```json
{
  "dependencies": {
    "meyda": "^5.6.3",
    "realtime-bpm-analyzer": "^5.0.0",
    "next": "^16.1.1",
    "react": "^19.2.0",
    "tailwindcss": "^4.0.0"
  }
}
```

### Scope Server Requirements

- Daydream Scope server running (local or RunPod)
- `longlive` pipeline loaded (or alternative)
- WebRTC connectivity established

### Browser Requirements

- Modern browser with Web Audio API support
- WebRTC support for Scope communication
- Recommended: Chrome/Edge for best Web Audio performance

---

## Performance Considerations

### Latency Budget (Revised)

Based on WebRTC architecture analysis and StreamDiffusion benchmarks:

| Component | Local/LAN | Internet/TURN | Notes |
|-----------|-----------|---------------|-------|
| Audio Analysis (Meyda) | ~15ms | ~15ms | Browser-side, consistent |
| Mapping Engine | ~5ms | ~5ms | Pure computation |
| WebRTC DataChannel | ~10ms | ~10ms | Low-overhead messaging |
| Network Transit | ~20ms | ~80-120ms | TURN adds significant latency |
| StreamDiffusion Pipeline | ~100-125ms | ~100-125ms | GPU-bound (~8 FPS on LongLive) |
| Video Encoding | ~15ms | ~15ms | VP8/H.264 encoding |
| WebRTC Video Transport | ~20ms | ~50-80ms | RTP packetization + transit |
| Video Decode + Render | ~10ms | ~10ms | Browser-side |
| **Total Audio→Visual** | **~200ms** | **~350-400ms** | See sync strategy in §7.5 |

**Critical Insight**: The ~125ms StreamDiffusion generation time is the dominant factor. At ~8 FPS, each frame takes ~125ms to generate regardless of network conditions.

### Optimization Strategies

1. **Parameter Update Rate**: 30Hz is sufficient; higher wastes bandwidth and doesn't improve perceived responsiveness
2. **Parameter Coalescing**: If audio changes faster than send rate, only latest values are sent
3. **Feature Buffer Size**: 60 frames (1 second) balances smoothness vs responsiveness
4. **Selective Updates**: Only send parameters that have changed beyond threshold
5. **Web Workers**: Consider offloading Meyda analysis to prevent UI blocking on lower-end devices
6. **Connection Stats Monitoring**: Track FPS, jitter, and dropped frames to detect degradation

### FPS Expectations

| Pipeline | Resolution | Expected FPS | Notes |
|----------|------------|--------------|-------|
| LongLive | 320×576 | ~8 FPS | Default Scope pipeline |
| StreamDiffusionV2 | 512×512 | ~12-15 FPS | Higher FPS, square aspect |
| Krea Realtime | 512×512 | ~6-8 FPS | Requires 32GB+ VRAM |

**Design Implication**: At ~8 FPS, visual changes occur every ~125ms. Audio analysis at 60Hz captures nuance that won't be visible at that rate—the mapping engine should smooth/average features over ~4-8 audio frames before each visual update.

---

## Error Handling

### Connection Failures

| Scenario | Detection | Response |
|----------|-----------|----------|
| **Scope server unreachable** | Health check fails | Show "Connecting to Scope..." → retry 3x → show error with manual retry button |
| **WebRTC connection drops** | DataChannel closes unexpectedly | Attempt automatic reconnection (3 attempts, 2s apart) → show reconnection UI |
| **Pipeline fails to load** | Status returns "error" | Display error message from API; offer alternative pipeline or retry |
| **Audio decode fails** | MediaElement error event | "This audio file couldn't be loaded. Try a different format (MP3 or WAV recommended)." |

### Graceful Degradation

```typescript
interface FallbackBehavior {
  // If BPM detection fails continuously
  beatDetectionFailed: 'disable_beats' | 'use_energy_peaks';

  // If Scope latency exceeds 500ms
  highLatency: 'reduce_update_rate' | 'simplify_mappings';

  // If browser tab backgrounded
  tabBackgrounded: 'pause_analysis' | 'continue_minimal';
}

const DEFAULT_FALLBACKS: FallbackBehavior = {
  beatDetectionFailed: 'use_energy_peaks',  // Use energy spikes as pseudo-beats
  highLatency: 'reduce_update_rate',         // Drop to 15Hz updates
  tabBackgrounded: 'pause_analysis',         // Resume when tab active
};
```

### User Feedback

- **Status indicator**: Always visible, shows connection state (🟢 Connected, 🟡 Reconnecting, 🔴 Disconnected)
- **Error toast**: Non-blocking notifications for recoverable errors
- **Error modal**: Blocking only for critical failures requiring user action

---

## End-of-Track Behavior

When the audio track ends:

1. **Visual Fade-Out** (2 seconds):
   - Gradually reduce `noise_scale` to minimum
   - Transition prompt to neutral state (base prompt only)
   - Lower denoising steps for softer output

2. **UI State**:
   - Show "Track ended" in player
   - Enable "Replay" button
   - If loop enabled: restart from beginning with brief transition

3. **Analysis Reset**:
   - Clear feature buffer
   - Reset peak values
   - Maintain theme selection

```typescript
function handleTrackEnd() {
  // Fade out over 60 frames (~2 seconds)
  const fadeOutFrames = 60;
  let frame = 0;

  const fadeInterval = setInterval(() => {
    const t = 1 - (frame / fadeOutFrames);
    sendParameters({
      noise_scale: currentNoiseScale * t * 0.5 + 0.3, // Fade to baseline
      // Keep prompt stable during fade
    });

    frame++;
    if (frame >= fadeOutFrames) {
      clearInterval(fadeInterval);
      resetAnalysisState();
    }
  }, 33);
}
```

---

## State Persistence

### What's Saved (localStorage)

```typescript
interface SoundscapeState {
  // Theme preferences
  lastUsedTheme: string;              // Theme ID
  customThemes: Theme[];              // User-created themes
  themeHistory: string[];             // Last 10 used themes

  // UI preferences
  volume: number;                     // 0-1
  showAnalysis: boolean;              // Analysis panel visibility
  preferredReactivity: number;        // Global reactivity multiplier

  // Session state (cleared on close)
  currentTrackName?: string;          // For display only
  currentPosition?: number;           // Not restored (requires re-upload)
}

const STORAGE_KEY = 'metadj-soundscape-state';
const MAX_CUSTOM_THEMES = 20;         // Prevent localStorage bloat
```

### Persistence Strategy

- **Theme selection**: Restored on page load
- **Custom themes**: Persisted across sessions (up to 20)
- **Volume/UI prefs**: Restored
- **Track state**: NOT persisted (requires re-upload due to file access)

### Future: Account Sync (v0.5+)

- Sync custom themes to MetaDJ Nexus account
- Share themes publicly
- Theme import/export as JSON

---

## Testing Strategy

### Development Without RunPod

To avoid GPU costs during development:

1. **Mock Scope Server**:
   - Create local Express server mimicking Scope API
   - Return static video stream or test pattern
   - Log received parameters for debugging

2. **Analysis-Only Mode**:
   - Run audio analysis without Scope connection
   - Display parameter outputs in debug panel
   - Validate mapping logic independently

3. **Recorded Sessions**:
   - Record parameter streams from real Scope sessions
   - Replay for UI/UX testing

### Test Categories

| Category | Approach | Tools |
|----------|----------|-------|
| **Audio Analysis** | Unit tests with recorded audio buffers | Vitest |
| **Mapping Engine** | Unit tests with mock feature data | Vitest |
| **Theme Validation** | Snapshot tests for parameter outputs | Vitest |
| **WebRTC Integration** | Integration tests with mock server | Playwright |
| **UI/UX** | Manual testing + visual regression | Playwright |

---

## Future Roadmap

### v0.2: Multi-Track & DJ Mode
- Queue multiple tracks
- Crossfade between tracks (audio and visual themes)
- BPM matching for visual transitions
- Pre-analyze tracks for optimal section mapping

### v0.3: Live Input
- Microphone input for live performance
- Spotify/streaming integration (where legal)
- External audio device routing

### v0.4: Advanced Analysis
- Machine learning section detection (verse/chorus/bridge)
- Genre detection for auto-theme suggestions
- Mood analysis for theme recommendations

### v0.5: Collaboration & Sharing
- Theme marketplace/sharing
- Export generated videos
- Share sessions with other users
- Integration with MetaDJ Nexus account system

### v0.6: Performance Integration
- OBS integration for streaming
- MIDI controller support
- Integration with MetaDJ Studio for live shows
- TouchDesigner/Spout output for VJ workflows

### v0.7: Storyteller Mode (Voice-Driven Visuals)

A separate mode where **spoken narrative drives visual generation** instead of music analysis.

**Core Concept**: User speaks a story in real-time → AI transcribes with ultra-low latency → Transcribed text updates prompts and parameters → Visuals evolve with the narrative.

**Technical Architecture**:
```
┌─────────────────┐    ┌──────────────────┐    ┌──────────────────┐
│   Microphone    │───▶│  Real-Time STT   │───▶│  Text Analyzer   │
│   (WebRTC)      │    │  (Streaming)     │    │  (NLP/Keywords)  │
└─────────────────┘    └──────────────────┘    └────────┬─────────┘
                                                        │
                       ┌──────────────────┐             │
                       │  Story Themes    │─────────────┤
                       │  (Genre-based)   │             │
                       └──────────────────┘             ▼
                                               ┌─────────────────┐
                                               │  Prompt Builder │
                                               │  (Dynamic)      │
                                               └────────┬────────┘
                                                        │
                                                        ▼
                                               ┌─────────────────┐
                                               │     Scope       │
                                               └─────────────────┘
```

**Real-Time STT Options** (open source, low-latency):
| Model | Latency | Notes |
|-------|---------|-------|
| **Kyutai** | ~1s | Best for real-time, English/French only |
| **NVIDIA Parakeet TDT** | <500ms | Streaming architecture, very fast |
| **Distil-Whisper** | ~1-2s | 4x faster than Whisper, 99+ languages |
| **Vosk** | <1s | Lightweight, works offline |
| **Moonshine** | <1s | Edge-optimized, smallest footprint |

**Text Analysis Pipeline**:
```typescript
interface NarrativeAnalysis {
  // Extracted from transcription
  keywords: string[];           // "dragon", "castle", "forest"
  mood: 'tense' | 'calm' | 'joyful' | 'mysterious' | 'action';
  setting: string;              // Inferred location/environment
  characters: string[];         // Mentioned entities

  // Mapped to Scope parameters
  intensity: number;            // Speech pace/volume → noise_scale
  emotionalTone: number;        // Sentiment → style modifiers
}
```

**Story Themes** (genre-based presets):
- **Fantasy Quest**: Castles, dragons, forests, magical elements
- **Sci-Fi Odyssey**: Spaceships, planets, technology, aliens
- **Mystery Noir**: Dark alleys, shadows, urban, atmospheric
- **Nature Journey**: Landscapes, animals, weather, seasons
- **Dream Sequence**: Abstract, surreal, flowing, transformative

**Voice-to-Visual Mapping**:
| Voice Feature | Visual Response |
|--------------|-----------------|
| **Keywords** | Prompt injection (add to base prompt) |
| **Speaking pace** | Transition speed (faster = quicker cuts) |
| **Volume/intensity** | noise_scale, denoising steps |
| **Pauses (silence)** | Prompt holds, gentle drift |
| **Emotional tone** | Style modifier weights |

**Keyword → Prompt Injection Example**:
```
User speaks: "The knight entered the dark forest..."
                          ↓
Extracted: ["knight", "dark", "forest"]
                          ↓
Updated prompt: "{base_theme_prompt}, medieval knight,
                 dark atmosphere, dense forest, shadows"
```

**Future TTS Integration** (optional):
[Chatterbox Turbo](https://www.resemble.ai/chatterbox-turbo/) (MIT license, <150ms latency) could enable:
- AI narrator responses
- Character voice synthesis
- Collaborative storytelling with AI

**Use Cases**:
- **Solo storytelling**: Describe scenes, watch them materialize
- **DM mode**: D&D/TTRPG dungeon masters creating live visuals
- **Bedtime stories**: Parents narrating with visual accompaniment
- **Creative writing**: Authors visualizing scenes as they draft
- **Meditation/guided journeys**: Spoken guidance → ambient visuals

### v0.8: Python Backend Layer

Introduce optional Python backend for advanced ML features while keeping browser-side analysis for real-time reactivity.

**Architecture**:
```
┌──────────────────────────────────────────────────────────────────┐
│                     HYBRID ARCHITECTURE                          │
├──────────────────────────────────────────────────────────────────┤
│                                                                  │
│  Browser (Real-Time)              Python Backend (ML/Analysis)   │
│  ┌─────────────────────┐          ┌─────────────────────────┐   │
│  │ Meyda.js (60Hz)     │          │ Librosa / Essentia      │   │
│  │ - RMS, Spectral     │          │ - Genre detection       │   │
│  │ - Beat detection    │          │ - Mood classification   │   │
│  │ - Real-time params  │          │ - Section segmentation  │   │
│  └─────────┬───────────┘          │ - Key/tempo analysis    │   │
│            │                       └───────────┬─────────────┘   │
│            │                                   │                 │
│            ▼                                   ▼                 │
│  ┌─────────────────────────────────────────────────────────┐    │
│  │              Parameter Fusion Layer                      │    │
│  │  (Browser combines real-time + pre-analyzed ML hints)    │    │
│  └─────────────────────────────────────────────────────────┘    │
│                                                                  │
└──────────────────────────────────────────────────────────────────┘
```

**Python Backend Features**:
- **Pre-analysis on upload**: Genre, mood, sections, key signature
- **Whisper STT**: Server-side transcription for Storyteller Mode
- **Recording/Export**: FFmpeg-based video rendering
- **Theme recommendations**: ML-suggested themes based on track analysis

**Tech Stack**:
- FastAPI or Flask for REST endpoints
- Librosa / Essentia for audio ML
- Whisper (OpenAI) or Distil-Whisper for STT
- Redis for caching analysis results
- Optional: Celery for async processing

**Why Hybrid**:
- Browser: Lowest latency for real-time reactivity (~0ms)
- Python: Best ML libraries (Librosa, Whisper) for smart features
- Best of both worlds: React fast, analyze deep

### v1.0: Platform Features
- User accounts and saved themes
- Track history and favorites
- Community features (comments, likes)
- Premium themes and features
- **Unified mode selector**: Music Mode / Storyteller Mode / Hybrid

---

## Risk Assessment

| Risk | Likelihood | Impact | Mitigation |
|------|------------|--------|------------|
| Scope latency too high | Medium | High | Pre-test with music; adjust expectations; reduce update rate |
| Audio analysis performance | Low | Medium | Use Web Workers; optimize buffer sizes |
| Theme-to-visual mismatch | Medium | Medium | Extensive testing; user adjustment controls |
| Browser compatibility | Low | High | Target Chrome; graceful degradation |
| RunPod costs during dev | Medium | Low | Mock server for development; budget management |
| Scope API changes | Low | High | Abstract Scope integration; pin to known API version |
| Audio format decode failures | Medium | Low | Clear error messages; recommend MP3/WAV |
| WebRTC NAT traversal issues | Medium | Medium | Use TURN servers (HF_TOKEN); fallback messaging |
| User creates nonsense prompts | High | Low | Guidance text; example prompts; no validation (let them experiment) |

---

## Success Metrics (MVP)

### Technical
- [ ] Audio-to-parameter latency <300ms
- [ ] 30Hz parameter update rate sustained
- [ ] All 4 preset themes produce distinct visuals
- [ ] Custom theme creation works end-to-end

### User Experience
- [ ] Load track in <3 seconds
- [ ] Theme switch in <2 seconds
- [ ] Clear visual response to music energy
- [ ] Beat sync visually perceptible

### Quality
- [ ] No audio/visual drift over 5-minute track
- [ ] Smooth parameter transitions (no jarring jumps)
- [ ] Handles track ending gracefully
- [ ] Error states clearly communicated

---

## Open Questions

1. **Pipeline Selection**: Should users be able to switch Scope pipelines, or lock to `longlive`?
   - *Recommendation*: Lock to `longlive` for MVP; add pipeline switching in v0.2

2. **VACE Usage**: Should we use reference images (MetaDJ avatar) as base?
   - *Recommendation*: Optional; default off for Soundscape (pure generative), but available

3. **Recording/Export**: Should MVP include video recording?
   - *Recommendation*: Defer to v0.3; focus on real-time experience first

4. **Mobile Support**: Priority for responsive design?
   - *Recommendation*: Desktop-first MVP; mobile in v0.4 (audio API limitations on mobile)

5. **Normalization Auto-Calibration**: Should spectral ranges auto-calibrate per track?
   - *Recommendation*: Use fixed defaults for MVP; add "calibrate to track" button in v0.2

6. **Theme Export/Import**: Allow users to share custom themes as files?
   - *Recommendation*: Defer to v0.5 with account sync; for MVP, localStorage only

7. **Scope Server Deployment**: Assume RunPod, or plan for self-hosted/local?
   - *Recommendation*: Design for both; document RunPod setup; local dev with mock server

8. **Project Naming**: "Soundscape" vs alternatives?
   - *Alternatives considered*: "SoundVision", "AudioReact", "Waveform", "Resonance"
   - *Recommendation*: "Soundscape" captures the journey/landscape metaphor aligned with MetaDJ brand

9. **Storyteller Mode STT Selection**: Which real-time transcription model?
   - *Candidates*: Kyutai (fastest), Distil-Whisper (multilingual), Vosk (lightweight)
   - *Recommendation*: Start with Distil-Whisper for language support; evaluate Kyutai for English-only low-latency needs

10. **Unified vs Separate Apps**: Should Music Mode and Storyteller Mode be one app or separate?
    - *Recommendation*: Single app with mode switcher; shared theme system, shared Scope integration, different input analyzers

11. **Connection Recovery UX**: How should we handle reconnection during playback?
    - *Options*: (a) Auto-reconnect silently, (b) Pause audio during reconnect, (c) Show overlay but keep audio playing
    - *Recommendation*: Keep audio playing with overlay; visual gap is less jarring than audio interruption

12. **Stats Display**: Should connection stats (FPS, jitter) be visible to users?
    - *Options*: (a) Always visible, (b) Debug mode only, (c) Visible in fullscreen on hover
    - *Recommendation*: Visible in fullscreen on hover for power users; hidden by default in normal view

13. **Audio-Visual Latency Disclosure**: Should we explain the ~200-400ms latency to users?
    - *Consideration*: Users may expect beat-perfect sync; managing expectations is important
    - *Recommendation*: Include subtle educational copy: "Visuals dance with your music in real-time" rather than promising beat-sync

14. **Pipeline Warm-Up Strategy**: LongLive takes ~10-30s to load on cold start. How to handle?
    - *Options*: (a) Pre-load on page visit, (b) Load on first play click, (c) Lazy load with loading animation
    - *Recommendation*: Pre-load on page visit with status indicator; better UX than waiting at play time

---

## References

### Daydream/Scope
- [Daydream Scope Documentation](https://docs.daydream.live/)
- [Daydream Scope GitHub](https://github.com/daydreamlive/scope)
- [About StreamDiffusion - Daydream Knowledge Hub](https://docs.daydream.live/knowledge-hub/reference/about-stream-diffusion)
- [StreamDiffusion Paper (arXiv)](https://arxiv.org/html/2312.12491v1)

### Audio Analysis
- [Meyda.js Audio Features](https://meyda.js.org/audio-features.html)
- [Realtime BPM Analyzer](https://github.com/dlepaux/realtime-bpm-analyzer)
- [Web Audio API MDN](https://developer.mozilla.org/en-US/docs/Web/API/Web_Audio_API)

### WebRTC
- [WebRTC API MDN](https://developer.mozilla.org/en-US/docs/Web/API/WebRTC_API)
- [WebRTC Low Latency Guide - VideoSDK](https://www.videosdk.live/developer-hub/webrtc/webrtc-low-latency)
- [Low-Latency WebRTC Streaming - Flussonic](https://flussonic.com/blog/article/low-latency-webrtc-streaming)

### Brand
- [MetaDJ Visual Identity Standards](../../../1-system/1-context/1-knowledge/9-visual-assets/visual-identity-context-standards.md)
