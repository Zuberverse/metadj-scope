# Architecture - MetaDJ Scope

**Last Modified**: 2025-12-26 12:37 EST
**Status**: Draft

## Purpose
Document the MVP architecture for the Scope-generated MetaDJ avatar demo.

## Overview
Scope is the avatar renderer. Webcam input provides motion/pose guidance. VACE locks identity. The output is a live video stream suitable for demo and streaming.

## System Flow (MVP)
```
[Webcam] -> [Scope Stream (StreamDiffusion + VACE + ControlNet)] -> [Live Output]
                       |                         |
                       |                         -> [Demo Viewer / OBS]
                       -> [Prompt + Params UI]
```

## Core Components

### 1. Input Capture
- Webcam feed (local device or browser capture).
- Format: whatever Scope ingest supports (API or desktop app).

### 2. Scope Stream
- **Model**: TBD (candidate models listed in `docs/scope-technical.md`).
- **VACE**: MetaDJ reference images for identity consistency.
- **ControlNet**: OpenPose if supported. Optional depth/edges if latency allows.
- **Dynamic Params**: subject to Scope API; start with prompt, guidance, delta, ControlNet scales if supported.

### 3. Control UI (Minimal)
- Prompt intensity slider or preset selector.
- Start/stop stream.
- Status indicator (warming, live, error).

### 4. Output
- Live video output from Scope.
- Display in a simple viewer or route to OBS.

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
