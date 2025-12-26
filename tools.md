# Tools - MetaDJ Scope

**Last Modified**: 2025-12-26 12:37 EST
**Status**: Draft

## Purpose
Track tools, services, and integrations for the Daydream Scope hackathon project.

## Core Platform

### Daydream Scope
- **Type**: Interactive AI video generation platform
- **GitHub**: https://github.com/daydreamlive/scope/
- **Docs**: https://docs.daydream.live/scope/introduction
- **API Docs**: https://github.com/daydreamlive/scope/blob/main/docs/server.md
- **VACE Docs**: https://github.com/daydreamlive/scope/blob/main/docs/api/vace.md
- **Status**: Primary platform for hackathon

### RunPod (Cloud GPU)
- **Type**: Cloud GPU compute
- **Quickstart**: https://docs.daydream.live/scope/getting-started/quickstart#cloud-deployment-runpod
- **Notes**: Browser-accessible Scope instance (port 8000); credits available on request
- **Status**: Available for cloud deployment

## Scope-Related Integrations

### Creative Tools (Future, Optional)
| Tool | Integration Type | Use Case | Status |
|------|-----------------|----------|--------|
| Unity | Game engine | Real-time 3D experiences | Not selected |
| Unreal Engine | Game engine | High-fidelity visuals | Not selected |
| TouchDesigner | Visual programming | Live performance/VJ | Not selected |
| ComfyUI | Node-based AI | Custom pipelines | Not selected |

## Development Stack (TBD)

### Scope Control UI (If Needed)
- Minimal web UI to control Scope stream parameters
- Framework TBD (keep scope-first; avoid extra dependencies)

### Alternative Stacks (Post-MVP)
- Unity + Scope (if 3D compositing is required)
- TouchDesigner + Scope (if live performance routing is required)
- Pure API integration (if headless control is sufficient)

## Zuberant Ecosystem Connections

### MetaDJ Studio
- Existing: Virtual stage performance engine
- Potential: Scope could power real-time AI visuals for performances

### MetaDJ Dream
- Existing: AI-driven creative tool (Daydream/StreamDiffusion)
- Potential: Direct relevance - same underlying tech stack

### MetaDJ Nexus
- Existing: Brand platform and hub
- Potential: Showcase/embed Scope-powered experiences

## Tool Selection Criteria
1. Does it fit the two-week timeline?
2. Does it leverage existing MetaDJ work?
3. Is it demoable without complex setup?
4. Does it tell a compelling story for judges?

## Notes
- Prioritize tools that Z already has experience with
- Avoid over-engineering; hackathon scope demands focus
- Document any new tool learnings in `docs/research.md`
