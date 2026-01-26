# MetaDJ Scope

*Parent: /3-projects/5-software/AGENTS.md*
**Last Modified**: 2026-01-23 22:30 EST

## Scope

Hackathon project for the Daydream Scope Track (interactive AI video).

- **MVP Focus**: Soundscape-only with demo track infinite loop
- **Current**: Root (`/`) redirects to Soundscape; Avatar Studio disabled for MVP
- **Stack**: Next.js 16 + TypeScript + Tailwind 4
- **Future**: Avatar Studio, audio upload/mic input modes

## Development Commands

```bash
npm run dev          # Dev server (port 3500)
npm run dev:turbo    # Turbopack dev
npm run build        # Production build
npm run start        # Production server (port 3500)
npm run lint         # ESLint
npm run type-check   # TypeScript
npm run test         # Vitest
```

## Soundscape MVP Startup

**Prerequisites**: RunPod pod must be running. Start via [console](https://console.runpod.io/pods?id=8tn9fypag1wnxz) and wait 2-3 minutes.

```bash
npm run dev  # http://localhost:3500 (redirects to /soundscape)
```

**URLs**:
- Local: http://localhost:3500
- Scope API (RunPod): https://8tn9fypag1wnxz-8000.proxy.runpod.net
- RunPod Console: https://console.runpod.io/pods?id=8tn9fypag1wnxz

**MVP Audio**: Demo track (Metaversal Odyssey) loops infinitely.

## Code Patterns

- Default to Next.js (App Router) + TypeScript + Tailwind
- Keep Scope API adapters isolated in `src/lib/`
- If build path requires Unity/Unreal/TouchDesigner, document in `docs/strategy.md`

## Development Patterns

- Treat the Scope API as system-of-record for interactive video execution
- Prefer small, demo-focused slices over broad feature sets
- Keep the stack humane and explainable

## Quality Gates

- `docs/scope.md` and `docs/strategy.md` updated before implementation
- `docs/architecture.md` updated before major build changes
- Security review for any external API, auth, or data storage
