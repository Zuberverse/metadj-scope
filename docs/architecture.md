# Architecture - MetaDJ Scope

**Last Modified**: 2025-12-29 12:26 EST
**Status**: Active

## Purpose
Document the architecture for MetaDJ Scope with Soundscape as the active experience and Avatar Studio paused.

---

## UI Approach

**Soundscape (current)**: Custom Next.js UI at `/soundscape` for in-browser audio analysis and parameter mapping.

**Avatar Studio (paused)**: Native Scope platform UI for webcam + VACE control (no custom UI build during hackathon).

---

## Soundscape System Flow

```
[Audio Input] -> [Audio Analyzer] -> [Mapping Engine] -> [WebRTC DataChannel] -> [Scope Pipeline]
                                                                              |
[Browser Video] <- [RTCPeerConnection Video Track] <- [Scope Server Output] <--+
```

### Audio Input Modes
- Demo track (local audio file)
- Upload (user audio file)
- Microphone (live input)

### Core Components
- `src/lib/soundscape/audio-analyzer.ts` - Meyda-based feature extraction
- `src/lib/soundscape/mapping-engine.ts` - Audio-to-parameter mapping
- `src/lib/soundscape/use-soundscape.ts` - React orchestration + throttled UI updates
- `src/lib/scope/client.ts` - Scope API + WebRTC integration
- `src/components/soundscape/*` - UI controls and visualization

---

## Soundscape WebRTC Flow

1. Health check: `GET /health`
2. Load pipeline: `POST /api/v1/pipeline/load` with `load_params` (width/height)
3. ICE servers: `GET /api/v1/webrtc/ice-servers`
4. Create peer connection and data channel (`parameters`)
5. Create offer and send to `POST /api/v1/webrtc/offer`
6. Apply answer + add ICE candidates
7. Send parameter updates via data channel (rate-limited)

---

## Pipeline Configuration (Soundscape)

**Default Pipeline**: `longlive`

**Load Params** (based on aspect ratio):
- 16:9: 1024x576
- 9:16: 480x832

**Rationale**: `longlive` provides stable output and smooth prompt transitions for audio-reactive visuals.

---

## Avatar Studio (Paused)

Avatar Studio remains documented but is not active in the current sprint. See:
- `docs/features/avatar-mvp-spec.md`
- `docs/scope-technical.md`

---

## Deployment Notes

**RunPod Instance (Active)**
- Pod: `metadj-scope`
- GPU: RTX Pro 6000 (96GB)
- Scope UI: https://t68d6nv3pi7uia-8000.proxy.runpod.net

---

## Future Integration Targets
- MetaDJ Studio (real-time performance visuals)
- MetaDJ Nexus (public-facing demos)
