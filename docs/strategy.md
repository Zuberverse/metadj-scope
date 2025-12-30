# Strategy - MetaDJ Scope

**Last Modified**: 2025-12-30 10:47 EST
**Status**: Active

## Purpose
Define the goals, constraints, and decision points for the Daydream Scope hackathon project, with Soundscape as the current focus.

## Selected Direction
Build **Soundscape** as the primary experience and bring **Avatar Studio** to MVP parity. Storyteller remains future-facing.

## Strategic Positioning

### Why Soundscape Matters for MetaDJ
- Directly aligned with DJ craft: music drives the experience.
- Real-time visuals extend MetaDJ Studio performance capability.
- Demonstrates human-orchestrated, AI-amplified creation in a compact demo.

### Unique Advantages
1. Audio expertise: DJ background maps naturally to reactive visual design.
2. Proven StreamDiffusion experience from MetaDJ Dream/Nexus work.
3. Clear creative narrative: sound becomes sight in real time.

## Goals

### Primary
- Ship a stable, end-to-end Soundscape demo (audio input -> analysis -> Scope output).
- Keep the experience responsive and visually consistent during playback.
- Ensure setup is simple for testing (one local UI, one Scope server URL).
 - Bring Avatar Studio to a stable, demo-ready stream with VACE identity lock.

### Secondary
- Establish a reusable theme system for future performance use.
- Validate parameter update rates and smoothing for low-jitter output.
- Document integration patterns for MetaDJ Studio/Nexus reuse.

## Success Metrics
- 60+ seconds of uninterrupted Soundscape output with consistent audio reactivity.
- At least one successful demo in each audio mode (demo, upload, mic).
- Setup time under 5 minutes from fresh pod to live visuals.

## Constraints
- Solo founder timeline and bandwidth.
- Hackathon timeline with midpoint (Jan 2) and final (Jan 9) demo dates.
- RunPod pod availability and cost management.

## Risks

| Risk | Impact | Mitigation |
|------|--------|------------|
| WebRTC connection drops | High | Add stream-stopped handling + clear error states |
| Pipeline load latency | Medium | Load params set up-front; document load expectations |
| Audio analysis jank | Medium | Throttle UI updates; keep analysis on audio thread |
| Oversized uploads | Medium | Enforce file size limit and surface errors |

## Decision Points

### Decision 1: UI Approach (Current)
**Decision**: Home focus selector with two tiles (Soundscape + Avatar Studio) that switch the main experience below. Native Scope UI remains a fallback.

**Rationale**:
- Soundscape requires in-browser audio analysis and parameter mapping.
- Avatar Studio now needs the same rapid iteration loop and UX polish as Soundscape.

### Decision 2: Pipeline Selection
**Decision**: Use `longlive` for Soundscape until performance testing suggests otherwise.

**Rationale**:
- Stable pipeline behavior and smooth transitions.
- Acceptable VRAM requirements on the current RunPod instance.

### Decision 3: Aspect Ratio Defaults
**Decision**: Default to 16:9 (1024x576), with optional 9:16 (480x832).

**Rationale**:
- 16:9 aligns with typical screens and demo capture.
- 9:16 remains available for social-first export.

## MVP Definition
- Audio input modes: demo track, upload, microphone.
- Theme selection + custom theme input.
- Audio analysis (energy, brightness, texture, beats).
- Parameter mapping + rate-limited WebRTC updates.
- Live visual output from Scope via WebRTC.

## Near-Term Plan

### Phase 1: Stabilize (Now)
1. Align WebRTC data channel behavior with Scope docs.
2. Ensure pipeline load params follow aspect ratio selection.
3. Harden audio upload validation.

### Phase 2: Polish (Next)
1. Calibrate mapping ranges per theme.
2. Add basic diagnostics for connection failures.
3. Capture demo flow steps for testing.

## Documentation Checkpoints
- Update `docs/architecture.md` when system flow changes.
- Update `CHANGELOG.md` for any behavior changes.
- Keep feature status aligned across README and docs.
