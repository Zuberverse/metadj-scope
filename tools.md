# Tools - MetaDJ Scope

**Last Modified**: 2025-12-26 17:45 EST
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
- **Console**: https://console.runpod.io/pods?id=gbc63llq1zdxki
- **Status**: Active deployment (`metadj-scope` pod)

#### Active Instance
| Property | Value |
|----------|-------|
| Pod Name | `metadj-scope` |
| Pod ID | `gbc63llq1zdxki` |
| GPU | RTX 5090 (32GB VRAM) |
| Scope UI | https://gbc63llq1zdxki-8000.proxy.runpod.net |
| Cost | **$0.89/hr** (On-Demand) |

#### Cost Management (Critical)

**Pricing Model**: This is an **On-Demand Pod**, not Serverless. You pay per hour while the pod is running, regardless of whether you're actively using it.

**Cost if left running idle:**
| Duration | Cost |
|----------|------|
| 1 hour | $0.89 |
| 1 day | ~$21 |
| 1 week | ~$150 |
| Full hackathon (17 days) | ~$360 |

**Development Session Workflow:**
1. **Start** pod from [RunPod Console](https://console.runpod.io/pods?id=gbc63llq1zdxki)
2. Wait ~2-3 min for startup (models already downloaded)
3. Open [Scope UI](https://gbc63llq1zdxki-8000.proxy.runpod.net) and work
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

## Development Stack (Scaffolded, Inactive)

### Scope Control UI (Future)
- Next.js 16 + TypeScript + Tailwind 4 scaffold in place
- Custom UI/UX deferred until after the hackathon demo

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
