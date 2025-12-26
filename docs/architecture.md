# Architecture - MetaDJ Scope

**Last Modified**: 2025-12-26 14:45 EST
**Status**: Active

## Purpose
Document the architecture for the Scope-generated MetaDJ avatar demo, including pipeline selection guidance and validated configuration.

---

## UI Approach Decision

**Hackathon (Current)**: Use native Scope platform UI directly. The Scope UI provides all necessary controls—webcam input, VACE configuration, prompt editing, and output display.

**Future**: Custom Next.js UI for branded MetaDJ experience and integration with MetaDJ Studio/Nexus.

---

## Pipeline Selection (Critical Decision)

### Recommended: `longlive` + VACE

For the MetaDJ avatar demo, **identity consistency is paramount**. The `longlive` pipeline with VACE enabled is the recommended choice:

```
Pipeline:     longlive
VACE:         ON (identity lock)
Output Style: Stylized/Artistic
VRAM:         ~20GB
```

### Pipeline Decision Matrix

| Use Case | Pipeline | VACE | Rationale |
|----------|----------|------|-----------|
| **MetaDJ Avatar Demo** | `longlive` | ON | Identity consistency crucial for brand |
| Realistic Portrait Test | `krea-realtime-video` | N/A | Photorealistic but no identity lock |
| Camera Debug | `passthrough` | N/A | Validate webcam before generation |
| General Experimentation | `streamdiffusionv2` | TBD | Balanced output |

### Why Not `krea-realtime-video`?

While `krea-realtime-video` produces more photorealistic output:
- **No VACE support** - Cannot lock MetaDJ identity
- **Higher VRAM** - Requires 32GB (Wan2.1-T2V-1.3B model)
- **Inconsistent output** - Varies based on prompt alone, no reference image guidance

For a hackathon demo where the MetaDJ avatar identity must be recognizable and consistent, photorealism is less important than identity lock.

---

## Overview

Scope is the avatar renderer. Webcam input provides motion/pose guidance. VACE locks identity. The output is a live video stream suitable for demo and streaming.

---

## System Flow (Hackathon MVP)

```
[Browser Webcam] -> [Scope UI @ RunPod] -> [Live Output]
                          |
                          +-- Pipeline: longlive
                          +-- VACE: ON (MetaDJ reference)
                          +-- Prompt: MetaDJ avatar style
                          +-- StreamDiffusion engine
```

### Configuration Details

```yaml
# Hackathon MVP Configuration
pipeline: longlive
input_mode: Video
video_source: Camera

vace:
  enabled: true
  scale: 0.7  # Balanced identity vs prompt
  reference_images:
    - metadj-avatar-v7.0.png

prompt:
  primary: "MetaDJ avatar, cyberpunk DJ, neon purple and cyan lighting"
  weight: 100%
  temporal_blend: Slerp
  transition_steps: 4

settings:
  height: 512
  width: 512
  seed: 42  # For reproducibility
  manage_cache: true
```

---

## System Flow (Future Custom UI)

```
[Webcam] -> [Next.js UI] -> [Scope API] -> [Live Output]
               |                |
               +-- Controls     +-- longlive pipeline
               +-- Presets      +-- VACE + StreamDiffusion
               +-- Status       |
                               -> [OBS/Streaming]
```

---

## Core Components

### Current (Hackathon)

1. **Scope Platform UI** (native)
   - Built-in webcam capture via browser
   - Pipeline selection (5 options available)
   - VACE reference upload and configuration
   - Multi-prompt editing with weights
   - Real-time output preview

2. **RunPod Instance**
   - Pod Name: `metadj-scope`
   - Pod ID: `gbc63llq1zdxki`
   - GPU: RTX 5090 (32GB VRAM)
   - Scope UI: `https://gbc63llq1zdxki-8000.proxy.runpod.net`
   - Cost: $0.89/hr (On-Demand)

### Future (Custom UI)

1. **Input Capture**
   - Browser webcam via Next.js app
   - WebRTC streaming to Scope API

2. **Scope API Client**
   - Typed client in `src/lib/scope/`
   - Pipeline selection and configuration
   - VACE parameter management
   - Stream lifecycle control

3. **Control UI**
   - MetaDJ-branded interface
   - Pipeline presets (Quick switch between modes)
   - Prompt presets for different MetaDJ styles
   - VACE scale control with real-time feedback
   - Stream status indicators

4. **Output Display**
   - Embedded Scope output
   - OBS integration for streaming

---

## Data Inputs

### Reference Images (VACE)
- **Primary**: MetaDJ avatar v7.0
- **Format**: PNG, high-resolution
- **Content**: Front-facing, well-lit
- **Purpose**: Identity anchor for VACE

### Video Input
- **Source**: Browser webcam
- **Resolution**: Native camera resolution
- **Purpose**: Motion/pose guidance

### Prompts
- **Primary style**: MetaDJ avatar characteristics
- **Lighting**: Neon purple/cyan aesthetic
- **Quality**: High quality, digital art style

---

## Outputs

- **Live video stream**: Real-time avatar generation
- **Resolution**: 512x512 default (configurable)
- **Frame rate**: ~8-15 FPS depending on pipeline
- **Format**: WebRTC stream via Scope UI

---

## Deployment Architecture

### Active Configuration (Dec 26)

```
┌─────────────────────────────────────────────────────────────┐
│                        RunPod Cloud                          │
│  ┌───────────────────────────────────────────────────────┐  │
│  │  Pod: metadj-scope (gbc63llq1zdxki)                   │  │
│  │  ┌─────────────────────────────────────────────────┐  │  │
│  │  │  GPU: RTX 5090 (32GB VRAM)                      │  │  │
│  │  │  ┌─────────────────────────────────────────┐    │  │  │
│  │  │  │  Scope Server                           │    │  │  │
│  │  │  │  - longlive pipeline                    │    │  │  │
│  │  │  │  - VACE enabled                         │    │  │  │
│  │  │  │  - StreamDiffusion engine               │    │  │  │
│  │  │  └─────────────────────────────────────────┘    │  │  │
│  │  │  Port 8000 → Proxy URL                          │  │  │
│  │  └─────────────────────────────────────────────────┘  │  │
│  └───────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
                              ↑
                              │ WebRTC + HTTPS
                              ↓
┌─────────────────────────────────────────────────────────────┐
│                      Local Browser                           │
│  - Webcam capture                                           │
│  - Scope UI interaction                                     │
│  - Output display                                           │
└─────────────────────────────────────────────────────────────┘
```

### Deployment Targets

| Target | Use Case | Status |
|--------|----------|--------|
| RunPod (RTX 5090) | Primary hackathon demo | Active |
| Local GPU | Development/testing | Optional |
| Custom cloud | Production (future) | Planned |

---

## Pipeline-Specific Architecture Notes

### longlive Pipeline (Recommended)

```
Input → StreamDiffusion → VACE Layer → Output
          ↑                  ↑
          │                  │
      Prompt             Reference
      Controls           Images
```

- VACE layer processes reference images
- Identity embedding applied to generation
- Prompt influences style, VACE locks identity

### krea-realtime-video Pipeline (Alternative)

```
Input → Wan2.1-T2V → Output
          ↑
          │
      Prompt
      Only
```

- No VACE layer available
- Prompt-only control
- More realistic but less consistent

---

## Future Enhancements (Post-MVP)

### Masking / Segmentation
Goal: alpha or mask for clean overlay (no square frame).
- Investigate Scope support for SAM3 or segmentation output
- If supported: generate mask in Scope and composite
- If not: treat as later extension

### Background Environment
- Use Scope prompts to generate environment behind the avatar
- Optionally separate avatar and background layers if supported

### TouchDesigner / Spout (Optional)
- Use only if Spout routing or live compositing is required
- Not needed for MVP

### Custom UI Integration
- Build branded MetaDJ experience
- Pipeline presets for quick style switching
- OBS/streaming integration
- Multi-scene management for live shows

---

## Resolved Questions

| Question | Answer | Source |
|----------|--------|--------|
| Webcam ingest method | Browser WebRTC via Scope UI | Validated Dec 26 |
| VACE availability | Pipeline-dependent (longlive: yes, krea: no) | Validated Dec 26 |
| VRAM requirements | 20GB for longlive, 32GB for krea | Validated Dec 26 |
| Model download behavior | First-run download, then VRAM load | Validated Dec 26 |

## Open Questions

- [ ] Exact latency numbers for each pipeline
- [ ] SAM3/segmentation support for alpha output
- [ ] Multi-reference image behavior with VACE
- [ ] LoRA adapter compatibility by pipeline

---

## References

- `docs/scope-technical.md` - Comprehensive pipeline documentation
- `docs/strategy.md` - Decision rationale
- `docs/research.md` - Technical findings
- `docs/scope.md` - Hackathon brief
