# Changelog

**Last Modified**: 2025-12-29 14:07 EST

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added
- **Soundscape MVP** - Complete audio-reactive visual generation feature
  - Full WebRTC connection flow (health check → pipeline load → ICE → SDP exchange)
  - Audio input modes: Demo track, file upload, and live microphone
  - 5 preset themes with configurable mappings (Cosmic Voyage, Neon Foundry, Digital Forest, Synthwave Highway, Crystal Sanctuary)
  - Audio analysis via Meyda.js (RMS, spectral centroid, spectral flatness, spectral rolloff, ZCR)
  - Beat detection with tempo tracking and beat-triggered effects
  - Mapping engine translating audio features to Scope parameters
  - ParameterSender with rate-limited DataChannel updates (30Hz)
  - AspectRatioToggle (16:9 widescreen / 9:16 portrait)
  - AnalysisMeter showing real-time audio analysis values
  - ThemeSelector with preset theme grid
  - Demo track: "Metaversal Odyssey" bundled in `/public/audio/`
- Soundscape page route at `/soundscape`
- Soundscape mapping engine unit tests (denoising steps, noise scale, beat cache reset)
- ESLint flat config for Next.js linting
- Cursor IDE rules (`.cursor/rules/cursor-rules.mdc`)
- Request timeouts to Scope API client (10s health, 30s default, 60s pipeline load)
- ARIA labels and accessibility attributes to UI components
- `aria-pressed` state for toggle buttons in PromptEditor
- `aria-live` regions for dynamic content updates

### Changed
- Documented custom UI as scaffold-only for the hackathon workflow
- Soundscape pipeline loading now passes aspect ratio resolution via `load_params`
- WebRTC connection flow now waits for pipeline readiness before SDP exchange
- `npm run test` now passes when no tests exist
- CLAUDE/README updated to reflect current commands and setup
- Environment variable renamed from `SCOPE_API_URL` to `NEXT_PUBLIC_SCOPE_API_URL` for client-side access
- AGENTS.md synced with CLAUDE.md structure for platform parity
- Scope API client aligned to `/api/v1` endpoints and WebRTC offer flow
- Scaffolded UI now establishes a WebRTC session (prompt-only; VACE ref images require Scope assets)
- Default VACE scale updated to 1.5 (slider range 0.0-2.0) and UI stats now reflect scaffold defaults
- Default generation resolution updated to 320x576 to match longlive defaults
- RunPod instance details updated to RTX Pro 6000 pod
- Added `check:scope` script for API connectivity checks
- PromptEditor handler wrapped in `useCallback` for performance optimization
- Consolidated duplicate questions section in `docs/research.md`

### Validated
- All 5 pipeline models downloaded on RunPod instance (longlive, krea-realtime-video, streamdiffusionv2, reward-forcing, passthrough)
- No first-run download delays—can switch pipelines instantly

### Fixed
- Scope API proxy now preserves query strings and supports non-JSON payloads (asset uploads)
- Soundscape ICE candidates now trickle once a session is established
- Soundscape initial parameters now include `manage_cache` for Scope defaults
- README now includes prerequisites and environment variables
- Soundscape data channel label aligned to `parameters` (Scope API requirement)
- Data channel now handles `stream_stopped` messages and surfaces errors
- Audio uploads enforce file type and 50MB size limit
- UI analysis updates throttled to reduce rendering jank
- Connection status and error messages now announce updates for screen readers
- ESLint config now uses named export to satisfy `import/no-anonymous-default-export` rule
- TypeScript type errors: `WebRtcOfferResponse.type` now uses `RTCSdpType`
- TypeScript type errors: `IceCandidatePayload.candidate` now accepts `undefined`
- Added explicit `type="button"` to all button elements

### Removed
- Unused `lucide-react` dependency (no imports found in source)
- Unused `clsx`, `tailwind-merge`, and `realtime-bpm-analyzer` dependencies

## [0.2.0] - 2025-12-26

### Added
- Comprehensive pipeline documentation covering all 5 Scope pipelines
- Pipeline selection decision matrix with trade-off analysis
- VACE compatibility matrix (validated: longlive=yes, krea-realtime-video=no)
- Prompt engineering guidance for both stylized and photorealistic output
- UI controls reference for Scope platform settings

### Decided
- **Pipeline Selection**: `longlive` + VACE for hackathon demo
  - Identity consistency is paramount for MetaDJ avatar
  - VACE locks character via reference images (NOT available on all pipelines!)
  - krea-realtime-video is photorealistic but has no identity lock
  - Trade-off: stylized output preferred over photorealism for brand consistency

### Validated
- VACE support confirmed on `longlive` pipeline
- VACE NOT available on `krea-realtime-video` (controls hidden in UI)
- Model download behavior: first-run download, then VRAM load
- VRAM requirements: ~20GB (longlive), 32GB (krea-realtime-video)

### Documentation
- `docs/scope-technical.md` - Complete pipeline reference
- `docs/architecture.md` - Pipeline selection guidance and configuration
- `docs/strategy.md` - Pipeline decision rationale (Decision 5)
- `docs/research.md` - Validated VACE compatibility findings
- `README.md` - Quick pipeline reference table

## [0.1.0] - 2025-12-26

### Added
- Initial repository scaffold and baseline documentation for the MetaDJ Scope hackathon project
- Next.js 16 + TypeScript + Tailwind 4 project setup (matches MetaDJ Nexus stack)
- Scope API client with typed interfaces for VACE generation
- Avatar Studio UI components (scaffolded for future custom UI)
- RunPod deployment with RTX 5090 GPU

### Changed
- Upgraded stack from Next.js 15 to Next.js 16
- Upgraded Tailwind CSS from v3 to v4 (CSS-based config)
- Updated dev server port to 2000

### Decided
- **UI Approach**: Use native Scope platform UI for hackathon; defer custom UI to future
  - Scope UI already provides webcam input, VACE controls, prompt editing, output display
  - Custom UI infrastructure ready for MetaDJ Studio integration later
  - Focus on avatar quality and demo polish, not infrastructure
