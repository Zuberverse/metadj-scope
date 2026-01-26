# MetaDJ Scope

**Last Modified**: 2026-01-10 15:37 EST

Hackathon exploration project for the Daydream Scope Track (Interactive AI Video Program). Real-time AI video generation powered by StreamDiffusion.

## Overview
- **Phase**: MVP Complete - Soundscape demo with infinite loop playback
- **Direction**: Audio-reactive AI video generation
- **RunPod**: Deployed (`metadj-scope` on RTX Pro 6000)
- **Current Module**: Soundscape (audio-reactive visuals)

## Key Features (Status)
- **Soundscape** (MVP): Audio-reactive visuals driven by real-time music analysis. Demo track loops infinitely.
- **Avatar Studio** (future): Webcam-driven MetaDJ avatar generation with VACE identity lock.
- **Storyteller** (future): Narrative visual mode for spoken or scripted prompts.

> **MVP Note**: This release focuses on Soundscape with the demo track. Additional modules (Avatar Studio, custom audio upload, mic input) will be added in future releases.

## Technology Stack
- Next.js 16 + TypeScript + Tailwind 4
- Meyda audio analysis library
- RunPod deployment (RTX Pro 6000) for real-time inference
- WebRTC for low-latency video streaming

## UI Approach

**MVP Structure**: Single-module focused experience:
- **Root** (`/`) — Redirects to Soundscape
- **Soundscape** (`/soundscape`) — Music-reactive AI visual generation (MVP)

**Soundscape**: Custom UI with in-browser audio analysis and parameter mapping streamed to Scope over WebRTC. Demo track loops infinitely for seamless visual generation.

**Future Modules**: Avatar Studio and additional audio input modes (upload, mic) will be added in future releases.

## Hackathon Context
- **Program**: Daydream 2025 Interactive AI Video Program (Scope Track)
- **Timeline**: Dec 22 - Jan 8 (two-week sprint)
- **Prizes**: $2,500 / $1,750 / $750 for top 3
- **Details**: See `docs/scope.md`

**Note**: The Scope Track hackathon served as the catalyst to begin development. MetaDJ Soundscape will continue evolving beyond the hackathon as part of the broader MetaDJ ecosystem.

### Scope Track Submission Assets
- `docs/scope-track-overview.md` - Concise project description for Creator Hub submission
- `docs/assets/soundscape-cover.jpg` - Cover art (1280x720) for hackathon submission
- `docs/assets/soundscape-cover.svg` - Source SVG for cover art

## MetaDJ Alignment
This project connects to the broader MetaDJ ecosystem:
- **MetaDJ Studio**: Virtual stage performance engine—Scope could power real-time visuals
- **MetaDJ Dream**: AI-driven creative tool—same StreamDiffusion foundation
- **MetaDJ Avatar**: VACE enables character-consistent generation for the MetaDJ avatar

**Technical Advantage**: Z has production experience with StreamDiffusion via MetaDJ Nexus Dream feature. Proven ControlNet configurations, timing patterns, and prompt engineering transfer directly to Scope.

## Soundscape Feature (Audio-Reactive Visuals)

**Status**: MVP Implementation Complete (Dec 29, 2025)

Soundscape transforms music into AI-generated visuals in real-time. Audio features (energy, brightness, beats) drive Scope generation parameters for music-reactive video.

### Architecture
```
[Audio Input] → [Meyda Analysis] → [Mapping Engine] → [WebRTC DataChannel] → [Scope GPU]
                                                                                    ↓
[Browser Video] ← ──────────────── [RTCPeerConnection] ← ─────────────── [Generated Frames]
```

### Audio Input (MVP)
| Mode | Description |
|------|-------------|
| **Demo** | Built-in track (Metaversal Odyssey) with infinite loop |

> **Future**: Upload and Mic modes will be added in future releases.

### Preset Themes
- **Cosmic Voyage** - Neon digital space with energy-responsive noise
- **Neon Foundry** - Industrial AI interior with beat-driven noise pulses
- **Digital Forest** - Bioluminescent nature/tech hybrid
- **Synthwave Highway** - Retro-futuristic driving visuals
- **Crystal Sanctuary** - Meditative crystalline environments

### Key Components
- `src/lib/soundscape/` - Audio analysis, mapping engine, themes, React hook
- `src/components/soundscape/` - UI components (Studio, Player, ThemeSelector, AnalysisMeter)
- `src/lib/scope/client.ts` - WebRTC and Scope API integration

### Quick Start
```bash
npm run dev
# Open http://localhost:3500 (redirects to Soundscape)
# 1. Click "Connect to Scope" (requires RunPod pod running)
# 2. Hit Play to start the demo track (loops infinitely)
# 3. Watch audio-reactive visuals generate in real-time
```

### Specification
See `docs/features/soundscape-mvp-spec.md` for complete technical specification (1,875 lines covering audio analysis, mapping, WebRTC, themes, and error handling).

### Troubleshooting

If video doesn't appear after connecting:

| Issue | Fix |
|-------|-----|
| "Server not healthy" | Health endpoint is `/health` (root-level, not `/api/v1/health`) |
| Connected but no frames | Pipeline must load with `vace_enabled: false` for text-to-video mode |
| Track shows `muted: true` | Use `pc.addTransceiver("video")` without `{ direction: "recvonly" }` |
| Generation doesn't start | Include `paused: false` in initial parameters |
| Pipeline stuck loading | Close native Scope UI tabs (conflicts with pipeline) |

See `docs/architecture.md` for detailed troubleshooting guide.

## Active Instance

| Property | Value |
|----------|-------|
| **Pod Name** | metadj-scope |
| **Pod ID** | `t68d6nv3pi7uia` |
| **GPU** | RTX Pro 6000 (96GB VRAM) |
| **Scope UI** | https://t68d6nv3pi7uia-8000.proxy.runpod.net |
| **Console** | [RunPod Dashboard](https://console.runpod.io/pods?id=t68d6nv3pi7uia) |
| **Cost** | $1.84/hr (On-Demand) |

> **Note**: Stop the pod when not in use to conserve credits. Restart from the RunPod console when needed.

## Pipeline Selection (Quick Reference)

**For MetaDJ avatar demo (active), use `longlive` + VACE** (identity consistency > photorealism).

| Pipeline | Best For | VACE | VRAM |
|----------|----------|------|------|
| **`longlive`** ⭐ | Identity-consistent avatars | ✅ Yes | ~20GB |
| `krea-realtime-video` | Photorealistic portraits | ❌ No | 32GB |
| `streamdiffusionv2` | General-purpose | TBD | ~20GB |
| `passthrough` | Debug webcam | N/A | Minimal |

**Key Trade-off**: `longlive` produces stylized output but locks MetaDJ identity via VACE. `krea-realtime-video` is photorealistic but has no identity consistency.

See `1-system/3-docs/external-tools/ai/daydream/streamdiffusion.md` for canonical pipeline details. `docs/scope-technical.md` captures MetaDJ Scope-specific assumptions.

## Installation

### Prerequisites
- Node.js 20.19+
- npm

```bash
npm install
```

Hackathon mode uses the custom UI for Soundscape and Avatar Studio; the native Scope UI remains a fallback.

## Development

### Local Development

```bash
# Start development server (port 3500)
npm run dev

# Build for production
npm run build

# Type check
npm run type-check
```

Local dev server: http://localhost:3500
Note: The UI uses Scope's WebRTC offer flow in video-to-video mode. Start the webcam before clicking "Start Generation." Set `NEXT_PUBLIC_SCOPE_API_URL` to your Scope server and load the `longlive` pipeline. Reference images only apply when the path is a Scope asset (e.g., `/assets/...`).

## Deployment

### Using Scope (Hackathon Workflow)

1. Start the RunPod pod from the [console](https://console.runpod.io/pods?id=t68d6nv3pi7uia)
2. Wait for startup (~2-3 minutes)
3. Open the [Scope UI](https://t68d6nv3pi7uia-8000.proxy.runpod.net)
4. Enable VACE and upload MetaDJ reference image
5. Configure prompt and start generation
6. Stop pod when done to save credits

## Commands
| Command | Description |
| --- | --- |
| `npm run dev` | Start development server (port 3500) |
| `npm run dev:turbo` | Start with Turbopack |
| `npm run build` | Build for production |
| `npm run start` | Start production server (port 3500) |
| `npm run lint` | Run ESLint |
| `npm run type-check` | TypeScript type check |
| `npm run check:scope` | Validate Scope API connectivity |
| `npm run test` | Run tests |

## Testing

```bash
npm run test
npm run test:watch
```

Tests use Vitest with jsdom (`vitest.config.ts`) and live in `tests/`.

## Architecture
- MVP architecture defined in `docs/architecture.md`
- **Current**: Root (`/`) redirects to Soundscape (`/soundscape`) — single-module MVP
- **API Client**: `src/lib/scope/` - typed Scope API client with WebRTC integration

## Environment Variables
See `.env.example` for the full list and comments.

| Variable | Required | Description |
| --- | --- | --- |
| `HF_TOKEN` | RunPod only | HuggingFace token for TURN server when deploying Scope on RunPod |
| `NEXT_PUBLIC_SCOPE_API_URL` | Local UI only | Scope API server base URL for browser requests |
| `SCOPE_API_URL` | Optional | Server-only API URL (scripts or server routes) |
| `SCOPE_PROXY_ENABLE` | Optional | Enable `/api/scope` proxy in production |
| `SCOPE_PROXY_TOKEN` | Optional | Shared proxy token (pair with `NEXT_PUBLIC_SCOPE_PROXY_TOKEN`) |
| `NEXT_PUBLIC_SCOPE_PROXY_TOKEN` | Optional | Browser token for proxy access |
| `LIVEPEER_API_KEY` | Optional | Future Livepeer integration |

## Documentation

### Platform Documentation (External Hub + Project Deltas)
Canonical platform documentation lives in `1-system/3-docs/external-tools/ai/daydream/` and official sources. The files below capture MetaDJ Scope-specific deltas only.
- `docs/scope-platform-reference.md` - **Scope platform delta** (project-specific notes)
- `docs/api-reference.md` - **Scope API delta** (endpoints we actually use)
- `docs/workflows-reference.md` - **Scope workflow delta** (WebRTC/VACE usage notes)
- `docs/runpod-reference.md` - **RunPod delta** (deployment decisions and active instance)
- `docs/touchdesigner-reference.md` - **TouchDesigner delta** (integration status and decisions)

### Project Documentation
- `docs/scope-track-overview.md` - **Scope Track submission overview** (MetaDJ Soundscape)
- `docs/scope.md` - Hackathon brief and requirements
- `docs/scope-technical.md` - Project-specific technical decisions
- `docs/strategy.md` - Goals, constraints, decision points
- `docs/architecture.md` - System design and WebRTC flow
- `docs/soundscape-mechanics.md` - **How Soundscape works** (latent cache, noise, FPS, transitions)
- `docs/features/avatar-mvp-spec.md` - MVP requirements
- `docs/features/soundscape-mvp-spec.md` - Soundscape specification
- `docs/research.md` - Research findings and validation notes
- `docs/nexus-daydream-reference.md` - StreamDiffusion patterns from MetaDJ Nexus
- `docs/future-integration-strategy.md` - Post-hackathon integration opportunities

### Reference
- `docs/api/` - API integration notes
- `docs/features/` - Feature specifications
- `docs/tools.md` - Tools and integrations
- `CHANGELOG.md` - Project milestones

## Key Decisions
1. **MVP Focus**: Soundscape-only with demo track infinite loop (Jan 7)
2. **UI Approach**: Root redirects to Soundscape; Avatar Studio disabled for MVP (Jan 7)
3. **Deployment**: RunPod with RTX Pro 6000 (96GB VRAM)
4. **Stack**: Next.js 16 + Tailwind 4 (matches MetaDJ Nexus)
5. **Pipeline**: `longlive` for stylized, smooth visual transitions
6. **Future**: Avatar Studio, audio upload/mic input, masking/segmentation

## Resources

### External
- `1-system/3-docs/external-tools/ai/daydream/` — Canonical Daydream docs hub
- [Scope GitHub](https://github.com/daydreamlive/scope/)
- [Scope Docs](https://docs.daydream.live/scope/introduction)
- [VACE API Docs](https://github.com/daydreamlive/scope/blob/main/docs/api/vace.md)
- [RunPod Docs](https://docs.runpod.io)
- [RunPod Console](https://console.runpod.io)
- [RunPod Scope Template](https://runpod.io/console/deploy?template=daydream-scope)

## Contributing

Internal project. Coordinate changes with Z and keep `docs/` aligned with hackathon decisions.

## License
Proprietary (internal) unless updated.
