# Architecture - MetaDJ Scope

**Last Modified**: 2025-12-26 13:45 EST
**Status**: Active

## Purpose
Document the architecture for the Scope-generated MetaDJ avatar demo.

## UI Approach Decision

**Hackathon (Current)**: Use native Scope platform UI directly. The Scope UI provides all necessary controls—webcam input, VACE configuration, prompt editing, and output display.

**Future**: Custom Next.js UI for branded MetaDJ experience and integration with MetaDJ Studio/Nexus.

## Overview
Scope is the avatar renderer. Webcam input provides motion/pose guidance. VACE locks identity. The output is a live video stream suitable for demo and streaming.

## System Flow (Hackathon MVP)
```
[Browser Webcam] -> [Scope UI @ RunPod] -> [Live Output]
                          |
                          +-- VACE (MetaDJ reference)
                          +-- Prompt controls
                          +-- StreamDiffusion pipeline
```

## System Flow (Future Custom UI)
```
[Webcam] -> [Next.js UI] -> [Scope API] -> [Live Output]
               |                |
               +-- Controls     +-- StreamDiffusion + VACE
               +-- Presets      +-- ControlNet (optional)
               +-- Status       |
                               -> [OBS/Streaming]
```

## Core Components

### Current (Hackathon)
1. **Scope Platform UI** (native)
   - Built-in webcam capture
   - VACE reference upload and configuration
   - Prompt editing and style controls
   - Real-time output preview

2. **RunPod Instance**
   - RTX 5090 GPU (32GB VRAM)
   - StreamDiffusion pipeline
   - VACE model loaded

### Future (Custom UI)
1. **Input Capture**
   - Browser webcam via Next.js app
   - WebRTC streaming to Scope API

2. **Scope API Client**
   - Typed client in `src/lib/scope/`
   - Stream management
   - Parameter updates

3. **Control UI**
   - MetaDJ-branded interface
   - Prompt presets for different styles
   - VACE scale control
   - Stream status indicators

4. **Output Display**
   - Embedded Scope output
   - OBS integration for streaming

## Data Inputs
- MetaDJ reference images (VACE).
- Webcam frames.
- Prompt presets (MetaDJ style).

## Outputs
- Live Scope stream (avatar video).
- Optional recorded demo capture.

## Deployment Targets
- Local GPU (if available).
- RunPod for reliable demo execution.

## Future Enhancements (Post-MVP)

### Masking / Segmentation
Goal: alpha or mask for clean overlay (no square frame).
- Investigate Scope support for SAM3 or segmentation output.
- If supported: generate mask in Scope and composite.
- If not: treat as later extension.

### Background Environment
- Use Scope prompts to generate environment behind the avatar.
- Optionally separate avatar and background layers if supported.

### TouchDesigner (Optional)
- Use only if Spout routing or live compositing is required.
- Not needed for MVP.

## Open Questions
- Which ingest method is available for webcam (API vs desktop app)?
- VACE input format and latency impact?
- Does Scope support segmentation output for alpha/mask?

## References
- `docs/strategy.md`
- `docs/research.md`
- `docs/scope.md`
