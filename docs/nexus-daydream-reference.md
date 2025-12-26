# MetaDJ Nexus Daydream Reference (For Scope)

**Last Modified**: 2025-12-26 12:22 EST
**Source**: Extracted from `3-projects/5-software/metadj-nexus/docs/daydream/`

## Purpose
Capture proven StreamDiffusion patterns from MetaDJ Nexus that may apply to the Scope hackathon. This serves as a technical baseline—Scope API may differ, but the underlying concepts are shared.

---

## Key Insight: Same Foundation, Different Interface

| Aspect | MetaDJ Nexus (Daydream API) | Daydream Scope |
|--------|----------------------------|----------------|
| **Core Tech** | StreamDiffusion | StreamDiffusion |
| **Deployment** | Hosted (Livepeer) | Desktop App + API Server + RunPod |
| **Input** | Webcam via WHIP | Webcam/video (method TBD) |
| **Output** | Livepeer iframe (HLS) | Local display or Spout output |
| **Unique Feature** | - | VACE (reference image guidance) |
| **Tool Integration** | Web-only | Spout → Unity, TouchDesigner, etc. |

**Bottom line**: The StreamDiffusion parameters, ControlNet patterns, and timing knowledge transfer directly. The API surface and deployment model differ.

---

## Proven StreamDiffusion Configuration (From Nexus)

### Production Payload (SD-Turbo)
```json
{
  "pipeline": "streamdiffusion",
  "params": {
    "model_id": "stabilityai/sd-turbo",
    "prompt": "androgynous cartoon magical dj blue sparkle",
    "negative_prompt": "blurry, low quality, flat, 2d",
    "seed": 42,
    "width": 512,
    "height": 512,
    "num_inference_steps": 25,
    "guidance_scale": 1,
    "delta": 0.7,
    "acceleration": "tensorrt",
    "use_denoising_batch": true,
    "do_add_noise": true,
    "t_index_list": [12, 20, 24],
    "enable_similar_image_filter": true,
    "prompt_interpolation_method": "slerp",
    "controlnets": [
      {
        "enabled": true,
        "model_id": "thibaud/controlnet-sd21-openpose-diffusers",
        "preprocessor": "pose_tensorrt",
        "conditioning_scale": 0.75
      },
      {
        "enabled": true,
        "model_id": "thibaud/controlnet-sd21-hed-diffusers",
        "preprocessor": "soft_edge",
        "conditioning_scale": 0.2
      },
      {
        "enabled": true,
        "model_id": "thibaud/controlnet-sd21-canny-diffusers",
        "preprocessor": "canny",
        "conditioning_scale": 0.2,
        "preprocessor_params": { "low_threshold": 100, "high_threshold": 200 }
      },
      {
        "enabled": true,
        "model_id": "thibaud/controlnet-sd21-depth-diffusers",
        "preprocessor": "depth_tensorrt",
        "conditioning_scale": 0.75
      },
      {
        "enabled": true,
        "model_id": "thibaud/controlnet-sd21-color-diffusers",
        "preprocessor": "passthrough",
        "conditioning_scale": 0.2
      }
    ]
  }
}
```

### ControlNet Scales (Production-Tuned)
| ControlNet | Scale | Purpose |
|------------|-------|---------|
| OpenPose | 0.75 | Body pose guidance (high influence) |
| Depth | 0.75 | 3D depth structure (high influence) |
| HED (soft edge) | 0.2 | Edge preservation (subtle) |
| Canny | 0.2 | Sharp edges (subtle) |
| Color | 0.2 | Color palette (subtle) |

### Key Parameter Notes
- **Resolution**: 512×512 is the sweet spot for SD-Turbo; divisible by 64
- **Steps**: 25 balances speed/quality
- **Guidance Scale**: 1.0 works well for real-time
- **Delta**: 0.7 provides good temporal smoothness
- **t_index_list**: `[12, 20, 24]` is production-tuned

---

## Dynamic Parameters (No Pipeline Reload)

These parameters can be updated live without triggering a ~30s pipeline reload:
- `prompt`
- `guidance_scale`
- `delta`
- `num_inference_steps`
- `t_index_list`
- `seed`
- `controlnets.conditioning_scale`

**All other parameters trigger full pipeline reload.**

---

## Timing & Warm-up

| Phase | Duration | Notes |
|-------|----------|-------|
| Stream creation | 2-5s | API call to create stream |
| Pipeline warm-up | 10-20s | Model loading, TensorRT compilation |
| WHIP handshake | 2-5s | WebRTC negotiation |
| **Total warm-up** | **15-25s** | Nexus shows 15s countdown |

### Warm-up Grace Period
- Poll status during warm-up
- Don't fail immediately on 404/409/429/5xx
- Continue polling through ~60s grace window
- Only surface errors after warm-up + grace

---

## Prompt Engineering (MetaDJ Style)

### Pattern
```
{persona} {style_keywords}
```

### Proven Combinations
| Persona | Style Keywords | Result |
|---------|---------------|--------|
| androgynous | cartoon magical dj blue sparkle | Default MetaDJ look |
| female | cartoon magical dj blue sparkle | Feminine variant |
| male | cartoon magical dj blue sparkle | Masculine variant |

### Negative Prompt (Standard)
```
blurry, low quality, flat, 2d
```

---

## Type Definitions (Likely Compatible)

### Stream Status
```typescript
type StreamStatus = "idle" | "connecting" | "streaming" | "error"
```

### Presentation/Persona
```typescript
type Presentation = "androgynous" | "female" | "male"
```

### Stream Response
```typescript
interface StreamResponse {
  id: string
  whip_url?: string        // WHIP ingest URL
  playback_id?: string     // Playback identifier
  playback_url?: string    // Direct playback URL
  status?: string          // Stream status
  error?: string           // Error message
}
```

### ControlNet Config
```typescript
interface ControlNetConfig {
  enabled: boolean
  model_id: string
  preprocessor?: string
  conditioning_scale: number
  preprocessor_params?: Record<string, unknown>
  control_guidance_start?: number
  control_guidance_end?: number
}
```

---

## WHIP Client Patterns (May Apply)

### Configuration
```typescript
{
  iceServers: [{ urls: "stun:stun.l.google.com:19302" }],
  iceTransportPolicy: "all",
  connectionTimeout: 45000,
  iceGatheringTimeout: 20000,
  enableTrickleICE: false,  // More reliable
}
```

### Key Learnings
- **Trickle ICE disabled** works better with Livepeer
- **Google STUN** sufficient for most NAT traversal
- **45s timeout** handles slow handshakes
- **Single client per stream** avoids races

---

## What's NEW in Scope (Not in Nexus)

### VACE (Video Anything Concept Engine)
- Reference image guidance for consistent character/style
- **Critical for MetaDJ Avatar idea**
- Docs: https://github.com/daydreamlive/scope/blob/main/docs/api/vace.md

### Spout Integration
- Output to Unity, Unreal, TouchDesigner
- Enables tool chaining
- Optional for future compositing or streaming overlays

### Desktop App
- Local GUI for interactive use
- May have different UX than API-only approach

---

## Validation Checklist (For Scope)

### API Compatibility
- [ ] Verify Scope API structure matches Daydream API
- [ ] Test stream creation payload format
- [ ] Confirm parameter update mechanism (PATCH equivalent)
- [ ] Check if WHIP is used or different ingest method

### VACE Testing
- [ ] Test with MetaDJ reference images
- [ ] Evaluate character consistency quality
- [ ] Determine latency impact of VACE

### ControlNet Compatibility
- [ ] Verify SD2.1 ControlNets work in Scope
- [ ] Test OpenPose for body tracking
- [ ] Evaluate if same scales apply

### Performance
- [ ] Compare warm-up time on RunPod
- [ ] Test with 512×512 vs other resolutions
- [ ] Measure end-to-end latency

---

## References

### MetaDJ Nexus Docs
- `metadj-nexus/docs/daydream/README.md` - Integration overview
- `metadj-nexus/docs/daydream/streamdiffusion-reference.md` - Parameter reference
- `metadj-nexus/docs/daydream/metadj-nexus-dream-mvp.md` - MVP implementation
- `metadj-nexus/src/lib/daydream/config.ts` - Production config
- `metadj-nexus/src/types/daydream.ts` - Type definitions

### Scope Docs
- https://github.com/daydreamlive/scope/
- https://docs.daydream.live/scope/introduction
- https://github.com/daydreamlive/scope/blob/main/docs/api/vace.md
