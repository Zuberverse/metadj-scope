# Scope Technical Overview

**Last Modified**: 2026-01-10 15:24 EST
**Status**: Project Delta

## Purpose

Project-specific technical assumptions for MetaDJ Scope. Canonical platform capabilities live in the external references hub. This file only captures decisions and deltas relevant to this project.

## Canonical External References

- `1-system/3-docs/external/ai/daydream/daydream-scope.md` — Scope platform reference
- `1-system/3-docs/external/ai/daydream/streamdiffusion.md` — StreamDiffusion reference
- https://docs.daydream.live/scope — Official Scope docs

## Current Technical Assumptions

- **Identity consistency**: Prefer `longlive` when VACE is required for avatar continuity.
- **Photorealistic experiments**: Use `krea-realtime-video` when realism matters more than identity lock.
- **Spout routing**: Treat Spout as optional until a live performance workflow requires it.
- **Cloud GPU**: RunPod-based deployment is acceptable for rapid iteration (see `docs/tools.md`).

## Project-Specific Locations

- Architecture decisions: `docs/architecture.md`
- Feature-level specs: `docs/features/`
- Research and validation: `docs/research.md`
