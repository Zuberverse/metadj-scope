# Changelog

**Last Modified**: 2025-12-30 22:15 EST

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added
- Home focus selector with two large tiles to switch between Soundscape and Avatar Studio
- Avatar Studio status messaging during connection flow (health, pipeline load, SDP, connected)
- Avatar Studio "Apply Updates" button to send prompt/VACE changes to the active stream
- Avatar Studio webcam ingest (video-to-video mode with `input_mode: "video"`)
- Avatar Studio auto-reconnect (3 attempts with backoff)
- Dynamic imports for Soundscape + Avatar Studio to reduce initial load
- Shared pipeline readiness helper for Scope health/load/wait setup
- Minimal Vitest coverage for focus toggle and Avatar Studio apply-updates UI
- jsdom dev dependency for DOM-based Vitest runs
- VACE asset path input in Avatar Studio (server asset path support)
- Optional proxy guard for `/api/scope` with `SCOPE_PROXY_ENABLE` + `SCOPE_PROXY_TOKEN`
- Brand font stack (Cinzel display, Poppins body, JetBrains Mono for code)
- `SCOPE_API_URL` and proxy token env examples in `.env.example`
- `docs/soundscape-mechanics.md` - Technical deep-dive on how Soundscape works (latent cache, noise, FPS, transitions, why forward motion happens)
- WebRTC reconnection logic with exponential backoff (max 3 attempts, 2s base delay)
- Retry button when connection fails after max reconnection attempts
- Real microphone level indicator using Web Audio API AnalyserNode
- Request timeout handling for Scope API proxy (30s default, 60s for pipeline load)
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
- **Intensity descriptors** - Dynamic prompt modifiers based on audio energy levels (low/medium/high/peak)
- **Beat modifiers** - Additional prompt text on beat detection ("rhythmic pulse", "beat-synchronized flash", "percussive impact")
- **Smooth prompt transitions** - All prompt changes (not just theme switches) now use 3-frame slerp transitions via Scope's transition API
- ESLint flat config for Next.js linting
- Cursor IDE rules (`.cursor/rules/cursor-rules.mdc`)
- Request timeouts to Scope API client (10s health, 30s default, 60s pipeline load)
- ARIA labels and accessibility attributes to UI components
- `aria-pressed` state for toggle buttons in PromptEditor
- `aria-live` regions for dynamic content updates

### Changed
- Avatar Studio promoted to active MVP alongside Soundscape
- WebRTC session setup now uses a shared helper to reduce duplication across Soundscape and Avatar Studio
- Avatar Studio pipeline load now toggles `vace_enabled` and always sends `paused: false`
- Avatar Studio start button now requires webcam to be active
- Soundscape UI parameter updates throttled to avoid unnecessary re-renders
- ParameterSender clears pending timers when data channel closes
- **Denoising steps set to 4-step schedule `[1000, 750, 500, 250]`** for high quality visuals (~15-20 FPS on RTX 6000)
- **Audio normalization tuned for better sensitivity**: `energyMax: 0.15` (was 0.5), `spectralCentroidMin: 100` (was 200), `spectralCentroidMax: 6000` (was 8000)
- **noise_scale ranges tightened for visual stability**: All themes now use 0.25–0.65 range (was 0.3–0.95) to prevent chaotic high-noise states
- **Beat boost intensity reduced**: Base beat response 0.08 (was 0.15), pulse_noise multiplier 0.25 (was 0.5), energy spike boost 0.12 (was 0.25)
- **Smoothing factor lowered**: 0.15 (was 0.3) for smoother noise_scale transitions between frames
- **All 5 theme prompts now include flythrough motion language** ("adventurous flythrough", "dynamic camera movement", etc.) for consistent forward-moving visuals
- Removed vaceScale from mapping engine and parameter smoothing (Soundscape is text-only, no VACE)
- Removed unused `computeDenoisingSteps()` method from MappingEngine (dead code cleanup)
- Default dev server port changed from 2000 to 3500 in package.json scripts
- Debug window assignment (`window.debugPeerConnection`) now gated behind `NODE_ENV === "development"`
- Mic level indicator now shows actual audio levels via Web Audio API AnalyserNode
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
- **All themes now use `pulse_noise` beat action** instead of `cache_reset` for smoother visual continuity (no periodic resets)
- **Beat modifiers now deterministic** (cycling through array) instead of random selection to reduce prompt thrashing
- **Prompt sending logic simplified** - always send prompts directly, add transition object only when blending between prompts
- **Debug logging for prompts** in dev mode - console logs `[Scope] Sending prompt:` to verify prompt updates are being sent
- **Resolution optimized for FPS** - widescreen now 576×320, portrait 320×576 (both ~15-20 FPS, Daydream defaults); dimensions must be divisible by 64
- **Energy spike prompt selection now deterministic** - cycles through variations instead of random selection to prevent jarring visual jumps
- **Pipeline load params now conditional** - `vace_enabled` only passed for `longlive` pipeline (other pipelines may not accept it)

### Validated
- `longlive` and `krea-realtime-video` pipelines working on RunPod instance
- `streamdiffusionv2` requires manual model download: `uv run download_models --pipeline streamdiffusionv2`
- `passthrough` ready (no model required)

### Fixed
- Soundscape disconnect now clears the data channel and stops ambient mode
- Avatar Studio data channel closure now stops the stream and cleans up connection state
- Audio mode now properly connects parameter sender to data channel when audio is connected after Scope (was causing audio to not drive visuals)
- Health endpoint uses `/health` (root-level, no `/api/v1/` prefix—unique to this endpoint; all other endpoints use `/api/v1/` prefix)
- Soundscape now loads pipeline with `vace_enabled: false` for pure text-to-video mode (was causing silent generation failure)
- Removed `vace_context_scale` from Soundscape parameter sender (not needed without VACE)
- Added `paused: false` to initial parameters and data channel messages (ensures generation starts immediately)
- Removed explicit `{ direction: "recvonly" }` from video transceiver (matches Scope API docs; let WebRTC negotiate naturally)
- Removed unused `energy` parameter from `checkBeat()` method (resolved ESLint warning)
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
