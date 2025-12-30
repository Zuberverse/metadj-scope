# MetaDJ Scope

**Last Modified**: 2025-12-29 21:22 EST

Hackathon exploration project for the Daydream Scope Track (Interactive AI Video Program). Building real-time AI video generation features centered on Soundscape. Avatar Studio and Storyteller are documented but not in scope for the current sprint.

## Overview
- **Phase**: Hackathon active - Soundscape MVP complete, polishing + testing
- **Direction**: Audio-reactive AI video (Soundscape focus)
- **RunPod**: Deployed (`metadj-scope` on RTX Pro 6000)
- **Features**: Soundscape (active), Avatar Studio (paused), Storyteller (future)

## Key Features (Status)
- **Soundscape** (active): Audio-reactive visuals driven by real-time music analysis.
- **Avatar Studio** (paused): Webcam-driven MetaDJ avatar generation (not current focus).
- **Storyteller** (future): Narrative visual mode for spoken or scripted prompts (renamed from Storytelling).

## Technology Stack
- Next.js 16 + TypeScript + Tailwind 4 (Soundscape UI active; Avatar UI deferred)
- Scope native UI (Avatar Studio demo)
- RunPod deployment (RTX Pro 6000) for real-time inference

## UI Approach

**Soundscape (current)**: Use the custom Soundscape UI at `/soundscape`. Audio analysis and parameter mapping run in the browser, then stream parameters to Scope over WebRTC.

**Avatar Studio (paused)**: Use native Scope platform UI directly at the RunPod instance. The Scope UI already provides webcam input, VACE controls, prompt editing, and output display.

**Future**: Expand the Next.js UI into a unified MetaDJ Scope control layer after the hackathon.

**Access Scope UI**: https://t68d6nv3pi7uia-8000.proxy.runpod.net

## Hackathon Context
- **Program**: Daydream 2025 Interactive AI Video Program (Scope Track)
- **Timeline**: Dec 22 - Jan 8 (two-week sprint)
- **Prizes**: $2,500 / $1,750 / $750 for top 3
- **Details**: See `docs/scope.md`

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
- **Neon Foundry** - Industrial AI interior with beat-triggered cache resets
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

**For MetaDJ avatar demo (paused), use `longlive` + VACE** (identity consistency > photorealism).

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

Hackathon mode uses the native Scope UI, so local install is only needed for future custom UI work.

## Development

### Local Development (Future Custom UI)

```bash
# Start development server (port 3500)
npm run dev

# Build for production
npm run build

# Type check
npm run type-check
```

Local dev server: http://localhost:3500
Note: The scaffold now uses Scope's WebRTC offer flow. Set `NEXT_PUBLIC_SCOPE_API_URL` to your Scope server and start the `longlive` pipeline before clicking "Start Generation." Reference images only apply when the path is a Scope asset (e.g., `/assets/...`).

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

## Architecture
- MVP architecture defined in `docs/architecture.md`
- **Current**: Native Scope UI for hackathon
- **Future**: Custom UI components in `src/components/`
- **API Client**: `src/lib/scope/` - typed Scope API client (for future integration)

## Environment Variables
See `.env.example` for the full list and comments.

| Variable | Required | Description |
| --- | --- | --- |
| `HF_TOKEN` | RunPod only | HuggingFace token for TURN server when deploying Scope on RunPod |
| `NEXT_PUBLIC_SCOPE_API_URL` | Local UI only | Scope API server base URL for the scaffolded UI |
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
- `docs/scope.md` - Hackathon brief and requirements
- `docs/scope-technical.md` - Project-specific technical decisions
- `docs/strategy.md` - Goals, constraints, decision points
- `docs/architecture.md` - System design
- `docs/features/avatar-mvp-spec.md` - MVP requirements
- `docs/research.md` - Research findings and validation notes
- `docs/nexus-daydream-reference.md` - StreamDiffusion patterns from MetaDJ Nexus
- `docs/future-integration-strategy.md` - Post-hackathon integration opportunities (custom apps, TouchDesigner, architecture)

### Reference
- `docs/api/` - API integration notes
- `docs/features/` - Feature specifications
- `tools.md` - Tools and integrations
- `CHANGELOG.md` - Project milestones

## Key Decisions
1. **UI Approach**: Native Scope UI for hackathon; custom UI deferred (Dec 26)
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
