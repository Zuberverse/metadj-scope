# Scope Technical Overview

**Last Modified**: 2025-12-26 12:37 EST
**Status**: Draft

## Purpose
Provide a general technical reference for Scope capabilities and integration options. This document is not project-specific; project decisions live in `docs/strategy.md`, `docs/architecture.md`, and `docs/features/avatar-mvp-spec.md`.

## Scope Capabilities (From Program Docs)
- Real-time AI video generation (StreamDiffusion-based pipeline).
- VACE (reference image guidance for consistency).
- Desktop app for interactive use.
- API server for programmatic control.
- Spout integration for tool chaining (Unity, TouchDesigner, etc.).
- Swagger UI available via `/docs` on the API server.

## Model Availability (To Validate)
The program notes mention the following models and modules. Availability should be confirmed against the Scope API docs and runtime.
- `stabilityai/sd-turbo`
- `stabilityai/sdxl-turbo`
- SAM3 (segmentation-related)
- StreamV2V (video-to-video)

## Integration Paths
- **API Server**: REST endpoints for stream creation and parameter updates.
- **Desktop App**: Local interactive control.
- **Spout Output**: Optional routing to external tools for compositing or performance control.

## Known Inputs and Outputs (To Validate)
- Input: webcam or video feed (method depends on API vs desktop app).
- Output: live video stream; Spout output if enabled.

## References
- Scope GitHub: https://github.com/daydreamlive/scope/
- Scope docs: https://docs.daydream.live/scope/introduction
- Scope API server docs: https://github.com/daydreamlive/scope/blob/main/docs/server.md
- Scope VACE docs: https://github.com/daydreamlive/scope/blob/main/docs/api/vace.md
