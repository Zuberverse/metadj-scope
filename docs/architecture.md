# Architecture - MetaDJ Scope

**Last Modified**: 2025-12-30 20:45 EST
**Status**: Active

## Purpose
Document the architecture for MetaDJ Scope with Soundscape and Avatar Studio active side-by-side.

---

## UI Approach

**Page Structure (current)**: Three dedicated pages for clean separation:
- **Home** (`/`) — Landing page with tiles linking to each experience
- **Soundscape** (`/soundscape`) — Dedicated page for music-reactive AI visuals
- **Avatar Studio** (`/avatar`) — Dedicated page for MetaDJ avatar generation with VACE

Each experience page shows its own Scope connection status in the header.

**Soundscape (current)**: Custom Next.js UI for in-browser audio analysis and parameter mapping.

**Avatar Studio (current)**: Custom UI with prompt editing, VACE asset path entry, webcam ingest, and WebRTC video-to-video streaming. Native Scope UI remains a fallback.

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
- `src/lib/scope/webrtc.ts` - Shared WebRTC session helper
- `src/lib/scope/pipeline.ts` - Shared health + pipeline readiness helper
- `src/components/soundscape/*` - UI controls and visualization

### Audio Analysis Configuration

**Normalization Defaults** (tuned for typical music):
| Parameter | Value | Rationale |
|-----------|-------|-----------|
| `energyMax` | 0.15 | Typical RMS peaks at 0.1-0.2; lower = more sensitivity |
| `spectralCentroidMin` | 100 Hz | Catches bass-heavy content |
| `spectralCentroidMax` | 6000 Hz | More sensitivity across spectrum |
| `spectralFlatnessMax` | 0.5 | Standard ceiling |

**Update Rates**:
- Meyda analysis: ~86 Hz (buffer 512 at 44.1kHz)
- Mapping engine: ~86 Hz (per Meyda callback)
- Parameter sender: 30 Hz (rate-limited to avoid flooding)
- UI state updates: 10 Hz (throttled to prevent React jank)

### Generation Configuration

**Denoising Steps**: `[1000, 750, 500, 250]` (4-step schedule)
- High quality visuals (~15-20 FPS on RTX 6000)
- Alternative: `[1000, 500, 250]` for 3-step at ~20-25 FPS
- Alternative: `[1000, 250]` for 2-step at ~25-35 FPS (lower quality)

**Prompt Transitions**: All prompt changes use smooth 3-frame slerp transitions
- Theme switches: 8-frame transition via theme system
- Within-theme prompt changes: 3-frame transition
- Beat action: `pulse_noise` (energy boost, no cache reset)

**Debug Logging** (dev mode): Console logs `[Scope] Sending prompt:` to verify prompt updates

---

## Soundscape WebRTC Flow

1. Health check: `GET /health` (root-level, NOT `/api/v1/health`)
2. Load pipeline: `POST /api/v1/pipeline/load` with `load_params`:
   - `vace_enabled: false` (critical for T2V mode without reference images)
   - `width`/`height` based on aspect ratio
3. Wait for pipeline status `"loaded"`: `GET /api/v1/pipeline/status`
4. Get ICE servers: `GET /api/v1/webrtc/ice-servers`
5. Create peer connection with ICE servers
6. Add video transceiver: `pc.addTransceiver("video")` (NO direction specified)
7. Create data channel: `pc.createDataChannel("parameters", { ordered: true })`
8. Create offer and send to `POST /api/v1/webrtc/offer` with `initialParameters`:
   - `prompts`, `denoising_step_list`, `manage_cache: true`, `paused: false`
9. Set remote description from answer
10. Trickle ICE candidates via `PATCH /api/v1/webrtc/offer/{sessionId}`
11. On data channel open: start sending parameter updates (rate-limited to 30Hz)

### Critical Implementation Notes

| Requirement | Details |
|-------------|---------|
| Health endpoint | `/health` (root-level, unique among all endpoints) |
| Pipeline load | Must set `vace_enabled: false` for text-to-video mode |
| Video transceiver | Use `pc.addTransceiver("video")` WITHOUT `{ direction: "recvonly" }` |
| Initial params | Include `paused: false` to ensure generation starts immediately |
| Data channel params | Include `paused: false` in ongoing updates |
| Session conflicts | Close native Scope UI tabs to avoid pipeline interference |

---

## Pipeline Configuration (Soundscape)

**Default Pipeline**: `longlive`

**Load Params** (based on aspect ratio):
- 16:9: 1024x576
- 9:16: 480x832

**Rationale**: `longlive` provides stable output and smooth prompt transitions for audio-reactive visuals.

---

## Avatar Studio (Active)

Avatar Studio runs in video-to-video mode: it sends a webcam video track to Scope and receives the transformed output in the same WebRTC session. VACE is enabled when a Scope server asset path is provided. See:
- `docs/features/avatar-mvp-spec.md`
- `docs/scope-technical.md`

### Avatar Studio WebRTC Notes
- Add the webcam track via `pc.addTrack(track, inputStream)` (no recv-only transceiver).
- Initial parameters must include `input_mode: "video"` for video-to-video.
- Match webcam resolution to pipeline resolution (default: 320x576).
- Apply updates by sending prompt/VACE changes over the data channel with `reset_cache: true`.
- Auto-reconnect attempts 3 retries with a 2s base delay when the data channel or connection drops.
- Webcam must be active before starting the stream.

---

## Deployment Notes

**RunPod Instance (Active)**
- Pod: `metadj-scope`
- GPU: RTX Pro 6000 (96GB)
- Scope UI: https://t68d6nv3pi7uia-8000.proxy.runpod.net

---

## Troubleshooting

### No Video Frames (Track muted)

**Symptoms**: WebRTC connects, ICE connected, data channel open, but `videoWidth: 0`, track `muted: true`

**Causes & Fixes**:

| Symptom | Likely Cause | Fix |
|---------|--------------|-----|
| "Scope server is not healthy" | Wrong health endpoint | Use `/health` not `/api/v1/health` |
| Silent generation failure | VACE enabled without ref images | Set `vace_enabled: false` in pipeline load |
| Track muted, no frames | Wrong transceiver setup | Use `pc.addTransceiver("video")` without direction |
| Connected but no generation | Missing paused flag | Add `paused: false` to initial params |
| Pipeline stuck loading | Conflict with native UI | Close other Scope tabs/sessions |

### Pipeline Loading Forever

**Symptoms**: Status polling shows `"loading"` indefinitely, `pipeline_id: null`

**Causes**:
1. Native Scope UI in another tab triggered a different pipeline
2. Previous session didn't clean up properly

**Fix**: Manually load the pipeline via curl or close conflicting tabs:
```bash
curl -X POST "https://YOUR-POD-8000.proxy.runpod.net/api/v1/pipeline/load" \
  -H "Content-Type: application/json" \
  -d '{"pipeline_id": "longlive", "load_params": {"vace_enabled": false}}'
```

### Debugging Tips

1. Check browser console for `[Soundscape]` prefixed logs
2. Check for `[Scope] Sending prompt:` logs to verify prompt changes
3. Verify pipeline status: `curl https://YOUR-POD-8000.proxy.runpod.net/api/v1/pipeline/status`
4. Check video element: `document.querySelector('video').srcObject.getTracks()[0].muted` should be `false`
5. ICE state should reach `connected` or `completed`

---

## Future Integration Targets
- MetaDJ Studio (real-time performance visuals)
- MetaDJ Nexus (public-facing demos)
