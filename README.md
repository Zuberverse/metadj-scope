# MetaDJ Scope

**Last Modified**: 2026-01-07 01:03 EST

Hackathon exploration project for the Daydream Scope Track (Interactive AI Video Program). Building real-time AI video generation across **Soundscape** and **Avatar Studio**, with dedicated pages for each experience.

## Overview
- **Phase**: Hackathon active - Soundscape + Avatar Studio MVPs, polishing + testing
- **Direction**: Audio-reactive AI video + MetaDJ avatar generation
- **RunPod**: Deployed (`metadj-scope` on RTX Pro 6000)
- **Features**: Soundscape (active), Avatar Studio (active), Storyteller (future)

## Key Features (Status)
- **Soundscape** (active): Audio-reactive visuals driven by real-time music analysis.
- **Avatar Studio** (active): Webcam-driven MetaDJ avatar generation with VACE identity lock.
- **Storyteller** (future): Narrative visual mode for spoken or scripted prompts.

## Technology Stack
- Next.js 16 + TypeScript + Tailwind 4 (Soundscape + Avatar Studio UIs active)
- Scope native UI fallback (Avatar Studio troubleshooting)
- RunPod deployment (RTX Pro 6000) for real-time inference

## UI Approach

**Page Structure**: Three dedicated pages for clean separation:
- **Home** (`/`) — Landing page with tiles linking to each experience
- **Soundscape** (`/soundscape`) — Music-reactive AI visual generation
- **Avatar Studio** (`/avatar`) — MetaDJ avatar generation with VACE

**Soundscape**: Custom UI with in-browser audio analysis and parameter mapping streamed to Scope over WebRTC.

**Avatar Studio**: Custom UI for prompt + VACE reference path + webcam ingest + WebRTC video-to-video streaming. Use "Apply Updates" to push prompt/VACE changes to the live stream. Native Scope UI remains available as a fallback.

**Access Scope UI**: https://t68d6nv3pi7uia-8000.proxy.runpod.net

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

### Audio Input Modes
| Mode | Description |
|------|-------------|
| **Demo** | Built-in track (Metaversal Odyssey) for testing |
| **Upload** | User-selected audio file |
| **Mic** | Live microphone input with echo cancellation |

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
# Open http://localhost:3500/soundscape
# 1. Select Demo mode and hit Play
# 2. Click "Connect to Scope" (requires RunPod pod running)
# 3. Watch audio-reactive visuals generate
```

### Avatar Studio Quick Start
```bash
npm run dev
# Open http://localhost:3500/avatar
# 1. Start Webcam
# 2. Click "Start Generation"
# 3. Adjust prompt/VACE and click "Apply Updates" to update the live stream
# 4. If the connection drops, the UI retries up to 3 times
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

See `docs/scope-technical.md` for complete pipeline documentation.

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
- **Current**: Landing page with links to dedicated Soundscape (`/soundscape`) and Avatar (`/avatar`) pages
- **Fallback**: Native Scope UI for troubleshooting
- **API Client**: `src/lib/scope/` - typed Scope API client (for future integration)

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

### Platform Documentation (Canonical Reference)
Complete platform documentation extracted from official sources:
- `docs/scope-platform-reference.md` - **Scope platform overview** (pipelines, deployment, usage)
- `docs/api-reference.md` - **Scope API reference** (endpoints, parameters, code examples)
- `docs/workflows-reference.md` - **Scope workflow guides** (WebRTC, VACE, LoRA, Spout)
- `docs/runpod-reference.md` - **RunPod platform reference** (Pods, GPUs, storage, networking, pricing)
- `docs/touchdesigner-reference.md` - **TouchDesigner reference** (operators, Spout integration, AI/ML workflows)

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
1. **UI Approach**: Dedicated pages — Home landing (`/`), Soundscape (`/soundscape`), Avatar (`/avatar`); native Scope UI fallback (Dec 30)
2. **Deployment**: RunPod with RTX Pro 6000 (96GB VRAM) - upgraded from RTX 5090 (Dec 27)
3. **Stack**: Next.js 16 + Tailwind 4 (matches MetaDJ Nexus)
4. **Pipeline**: `longlive` + VACE for identity consistency (Dec 26)
5. **Future**: Masking/segmentation and background environments

## Resources

### External
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
