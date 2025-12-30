# Tools - MetaDJ Scope

**Last Modified**: 2025-12-30 17:31 EST
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
- **Type**: Cloud GPU compute (On-Demand Pod)
- **Quickstart**: https://docs.daydream.live/scope/getting-started/quickstart#cloud-deployment-runpod
- **Console**: https://console.runpod.io/pods?id=t68d6nv3pi7uia
- **Status**: Active deployment (`metadj-scope` pod)

#### Active Instance
| Property | Value |
|----------|-------|
| Pod Name | `metadj-scope` |
| Pod ID | `t68d6nv3pi7uia` |
| GPU | RTX Pro 6000 (96GB VRAM) |
| Scope UI | https://t68d6nv3pi7uia-8000.proxy.runpod.net |
| Cost | **$1.84/hr** (On-Demand) |

#### Cost Management (Critical)

**Pricing Model**: This is an **On-Demand Pod**, not Serverless. You pay per hour while the pod is running, regardless of whether you're actively using it.

**Cost if left running idle:**
| Duration | Cost |
|----------|------|
| 1 hour | $1.84 |
| 1 day | ~$44 |
| 1 week | ~$309 |
| Full hackathon (17 days) | ~$751 |

**Development Session Workflow:**
1. **Start** pod from [RunPod Console](https://console.runpod.io/pods?id=t68d6nv3pi7uia)
2. Wait ~2-3 min for startup (models already downloaded)
3. Open [Scope UI](https://t68d6nv3pi7uia-8000.proxy.runpod.net) and work
4. **Stop** pod when done to save credits

**Why not Serverless?** Serverless would allow "always available" without idle costs, but requires packaging Scope as a serverless handler—too complex for hackathon timeline. Start/stop workflow has minimal friction (~2-3 min startup).

**Models Status**: All 5 pipeline models are pre-downloaded on this instance. No additional download wait on restart.

## Scope-Related Integrations

### Creative Tools (Future, Optional)
| Tool | Integration Type | Use Case | Status |
|------|-----------------|----------|--------|
| Unity | Game engine | Real-time 3D experiences | Not selected |
| Unreal Engine | Game engine | High-fidelity visuals | Not selected |
| TouchDesigner | Visual programming | Live performance/VJ | Not selected |
| ComfyUI | Node-based AI | Custom pipelines | Not selected |

## Development Stack (Active)

### Scope Control UI (Current)
- Next.js 16 + TypeScript + Tailwind 4
- Dedicated pages: Home (`/`), Soundscape (`/soundscape`), Avatar (`/avatar`)
- Vitest + jsdom for UI regression tests

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
