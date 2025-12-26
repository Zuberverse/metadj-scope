# Daydream Scope Track - Hackathon Brief

**Last Modified**: 2025-12-26 16:30 EST
**Source**: Daydream Scope track program notes provided by the track lead.

## Overview
The Scope Track is part of the Daydream 2025 Interactive AI Video Program. The program runs for two weeks with workshops, office hours, and demo checkpoints. The goal is to build and demo an interactive AI video experience using Scope.

## Timeline
- Build window: Dec 22 to Jan 8 (two-week sprint).
- Key dates and workshops (all sessions at 6pm CET / 12pm ET / 9am PT):
  - Dec 22: Kickoff (cohort intro, mentors, housekeeping).
  - Dec 23: Workshop #1 with Yondon (Scope fundamentals, desktop app, API).
  - Dec 26: Workshop #2 with Yondon (Spout integration, connecting with other tools).
  - Jan 2: Midpoint check-in.
  - Jan 9: Project completion and voting.
  - Jan 13: Finalists demo day and winner announcements.

## Office Hours
- Daily office hours: 5pm to 6pm Central EU time.
- No office hours on Dec 24, Dec 25, Dec 31, or Jan 1.

## Prizes
- 1st place: $2,500
- 2nd place: $1,750
- 3rd place: $750

## Required Next Steps
- Create Community Hub profile: https://app.daydream.live/discover (click "Create profile").
- Share the profile in the Hub for community visibility.
- Use the Hub for questions and progress updates.
- DM email if calendar invites do not arrive by end of week.
- Post an introduction (name, location, what you want to build/explore).

## Build Directions (Suggested)
### Extending Scope
- Support new models (SAM3, StreamV2V, etc.).
- Build new pipeline modules.
- Explore avatar tech and conversational AI.

### Integrate with Tools
- Unity, Unreal Engine, ComfyUI, TouchDesigner + Scope.
- Speech and voice interfaces.

### Build Broader Experiences
- CYOA-style games (LLM narrative + Scope visuals).
- Interactive educational content.
- AI avatars and companions.

## Resources and Links

### Official Docs
- Scope GitHub: https://github.com/daydreamlive/scope/
- Scope docs: https://docs.daydream.live/scope/introduction
- RunPod quickstart: https://docs.daydream.live/scope/getting-started/quickstart#cloud-deployment-runpod
- RunPod video tutorial: (embedded in quickstart page - "How to Run Daydream Scope in the Cloud")
- Scope FAQ: https://www.notion.so/livepeer/Interactive-Video-Hacker-Program-Scope-FAQ-2d20a348568780b3bb81f8f38086caa1

### API References
- Scope API VACE docs: https://github.com/daydreamlive/scope/blob/main/docs/api/vace.md
- Scope API server docs (Quick Start + workflows): https://github.com/daydreamlive/scope/blob/main/docs/server.md
- Scope API + core library walkthrough (Notion): https://www.notion.so/livepeer/Scope-Server-API-and-Core-Library-2b20a348568780b791f4e0d8b33d85b7

### Deployment
- RunPod template: https://runpod.io/console/deploy?template=daydream-scope
- HuggingFace tokens: https://huggingface.co/settings/tokens

## Updates and Clarifications
- VACE usage is documented in the Scope API docs (see VACE link above).
- The Scope API server docs include a Quick Start and workflows section.
- The `/docs` endpoint on the API server should reflect current Swagger UI info.
- A demo frontend for VACE reference images was shown; the build process used the API docs above.

## RunPod Notes

**Full setup documented in**: `docs/research.md` (RunPod Setup section)

**Quick Reference:**
- **Template**: https://runpod.io/console/deploy?template=daydream-scope
- **Access**: Port 8000 (`https://your-instance-id.runpod.io:8000`)
- **Required**: HuggingFace token with read permissions (set as `HF_TOKEN` env var)
- **GPU**: Minimum ≥24GB VRAM, recommended RTX 4090/5090, CUDA 12.8+
- **Cost**: ~$0.44/hr for RTX 4090 ($20 credits ≈ 45 hours)
- **First run**: Looping cat video, ~8 FPS expected

**Key info:**
- HuggingFace integration provides **10GB free streaming/month** via Cloudflare TURN servers
- TURN server enables WebRTC in cloud environments with restrictive firewalls
- Credits available on request through the program thread

## Assumptions and Open Questions
- Assumption: the dates above refer to the current program cycle; confirm year if needed.
- Open question: confirm final deliverable format and judging criteria.
- Open question: confirm any restrictions on models or external integrations.
