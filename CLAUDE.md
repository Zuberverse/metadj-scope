# Claude Code Guide - MetaDJ Scope

> Execution guide for the Daydream Scope hackathon exploration project.

**Platform Notice**: This `CLAUDE.md` is optimized for Claude Code sessions. OpenAI Codex (via the Codex CLI) follows the accompanying `AGENTS.md`, and Cursor IDE uses `.cursor/rules/` guidance when present; each platform gets the same standards.

**Last Modified**: 2025-12-26 14:41 EST
*Parent: /3-projects/5-software/CLAUDE.md*

## Repository Organization
- Root stays minimal: `README.md`, `CHANGELOG.md`, `AGENTS.md`, `CLAUDE.md`, configs.
- Use `src/`, `public/`, `docs/`, `scripts/`, `tests/` as needed.
- No archive folder for software projects; use git history.
- No temp or duplicate files (avoid "old", "backup", "copy").

## Project Context
- Hackathon project for the Daydream Scope Track (interactive AI video).
- Goal: identify a focused Scope-based demo and implement an MVP for the program timeline.
- Current approach: use the native Scope UI for the hackathon demo; custom UI/UX is deferred.
- Stack scaffolded: Next.js 16 + TypeScript + Tailwind 4 (inactive until post-hackathon).

## Visual System Alignment
- Follow `1-system/1-context/1-knowledge/9-visual-assets/visual-identity-context-standards.md` for UI work.
- Use OKLCH-based colors and typography standards when a UI is built.
- Reference MetaDJ Nexus tokens as canonical implementation guidance.

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
- `npm run dev` - Start development server (port 2000)
- `npm run dev:turbo` - Start dev server with Turbopack
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run lint` - Run ESLint
- `npm run type-check` - TypeScript type check
- `npm run test` - Run Vitest (passes with no tests until a suite exists)

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
