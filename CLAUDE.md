# Claude Code Guide - MetaDJ Scope

> Execution guide for the Daydream Scope hackathon exploration project.

**Platform Notice**: This `CLAUDE.md` is optimized for Claude Code sessions. OpenAI Codex (via the Codex CLI) follows the accompanying `AGENTS.md`, and Cursor IDE uses `.cursor/rules/` guidance when present; each platform gets the same standards.

**Last Modified**: 2026-01-03 23:27 EST
*Parent: /3-projects/5-software/CLAUDE.md*

## User Context
- Assume the user is Z unless explicitly stated otherwise—apply Z's voice, solo-founder learning-developer framing, and skip identity discovery questions.

## Repository Organization
- Root stays minimal: `README.md`, `CHANGELOG.md`, `AGENTS.md`, `CLAUDE.md`, configs.
- Use `src/`, `public/`, `docs/`, `scripts/`, `tests/` as needed.
- No archive folder for software projects; use git history.
- No temp or duplicate files (avoid "old", "backup", "copy").

## Project Context
- Hackathon project for the Daydream Scope Track (interactive AI video).
- Goal: identify a focused Scope-based demo and implement an MVP for the program timeline.
- Current approach: custom Next.js UI is active for Soundscape + Avatar Studio; native Scope UI remains a fallback for troubleshooting.
- Stack active: Next.js 16 + TypeScript + Tailwind 4 (Soundscape + Avatar Studio UIs live).

## Visual System Alignment
- Follow `1-system/1-context/1-knowledge/9-visual-assets/visual-identity-context-standards.md` for UI work.
- Use OKLCH-based colors and typography standards when a UI is built.
- Reference MetaDJ Nexus tokens as canonical implementation guidance.

## Relevant Agents
- software (architecture and code quality)
- coder (implementation and fixes)
- ai (AI/ML strategy and integration)
- product (requirements and UX)
- operations (deployment and reliability)

## Relevant Skills
- software-development-coordinator
- api-designer
- ai-integration-auditor
- documentation-generator
- test-generator
- accessibility-validator
- visual-identity-validator
- performance-optimizer

## Development Standards
### Code Patterns
- Assumption: if a web UI is chosen, default to Next.js (App Router) + TypeScript + Tailwind.
- If the build path requires Unity, Unreal, or TouchDesigner, document the alternative stack in `docs/strategy.md`.
- Keep integration layers thin and well documented (Scope API adapters isolated in `src/lib/`).

### Quality Standards
- Keep linting, type checks, and tests green once tooling exists.
- Document trade-offs and security considerations in `docs/architecture.md`.
- Update README and CHANGELOG for meaningful milestones.

## Workflow and Commands
- `npm run dev` - Start development server on port 3500 (override with `PORT=XXXX npm run dev`)
- `npm run dev:turbo` - Start dev server with Turbopack
- `npm run build` - Build for production
- `npm run start` - Start production server on port 3500
- `npm run lint` - Run ESLint
- `npm run type-check` - TypeScript type check
- `npm run test` - Run Vitest test suite

## Soundscape MVP Startup

**Port**: 3500 (default in package.json scripts)

**Prerequisites**:
1. RunPod pod must be running (start via console: https://console.runpod.io/pods?id=8tn9fypag1wnxz)
2. Wait 2-3 minutes for pod initialization and Scope API to be ready

**Startup Sequence**:
```bash
# 1. Start local dev server (soundscape MVP)
cd 3-projects/5-software/metadj-scope
npm run dev  # Runs on http://localhost:3500

# 2. Access soundscape
open http://localhost:3500/soundscape
```

**URLs**:
- Local Soundscape: http://localhost:3500/soundscape
- Scope API (RunPod): https://8tn9fypag1wnxz-8000.proxy.runpod.net
- RunPod Console: https://console.runpod.io/pods?id=8tn9fypag1wnxz

## Coordination Patterns
- Discovery and scoping: product + software, with documentation-generator support.
- Prototype build: coder + ai, with software oversight.
- Review and QA: performance-optimizer + accessibility-validator.
- Release readiness: operations + software.

## Quality Gates
- `docs/scope.md` and `docs/strategy.md` updated before implementation begins.
- `docs/architecture.md` updated before any major build changes.
- README and CHANGELOG updated for meaningful milestones.
- Security review for any external API, auth, or data storage.

## Automatic Documentation
- Update `docs/scope.md` when new program guidance arrives.
- Update `docs/strategy.md` after each decision point.
- Keep `docs/architecture.md` synced with implementation.
- Maintain `CHANGELOG.md` for project milestones.

## Development Patterns
- Treat the Scope API as the system-of-record for interactive video execution.
- Prefer small, demo-focused slices over broad feature sets.
- Keep the stack humane and explainable for a solo founder.

## Common Tasks
- Add a new hackathon update: edit `docs/scope.md`, then link any new resources.
- Record a decision: update `docs/strategy.md` and note rationale.
- Start implementation: define the stack in `docs/strategy.md` and outline components in `docs/architecture.md`.

## Code Review Checklist
- Lint and type checks pass (once configured).
- Tests pass for any implemented features.
- Docs updated (`README.md`, `docs/architecture.md`, `CHANGELOG.md`).
- No secrets or local-only files committed.
- Performance and accessibility considered for any UI work.
