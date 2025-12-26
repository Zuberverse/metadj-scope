# Changelog

**Last Modified**: 2025-12-26 15:21 EST

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added
- ESLint flat config for Next.js linting

### Changed
- Documented custom UI as scaffold-only for the hackathon workflow
- `npm run test` now passes when no tests exist
- CLAUDE/README updated to reflect current commands and setup
- Environment variable renamed from `SCOPE_API_URL` to `NEXT_PUBLIC_SCOPE_API_URL` for client-side access

### Fixed
- README now includes prerequisites and environment variables
- ESLint config now uses named export to satisfy `import/no-anonymous-default-export` rule

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
