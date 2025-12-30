# API Notes

**Last Modified**: 2025-12-30 17:45 EST

Central index for Scope API integration notes.

## Official API Documentation

| Topic | Official Link |
|-------|---------------|
| **API Overview** | [docs/api/](https://github.com/daydreamlive/scope/tree/main/docs/api) |
| **Pipeline Loading** | [docs/api/load.md](https://github.com/daydreamlive/scope/blob/main/docs/api/load.md) |
| **Parameters** | [docs/api/parameters.md](https://github.com/daydreamlive/scope/blob/main/docs/api/parameters.md) |
| **Receive Video (T2V)** | [docs/api/receive.md](https://github.com/daydreamlive/scope/blob/main/docs/api/receive.md) |
| **Send & Receive (V2V)** | [docs/api/sendreceive.md](https://github.com/daydreamlive/scope/blob/main/docs/api/sendreceive.md) |
| **VACE API** | [docs/api/vace.md](https://github.com/daydreamlive/scope/blob/main/docs/api/vace.md) |
| **Server Setup** | [docs/server.md](https://github.com/daydreamlive/scope/blob/main/docs/server.md) |

## Current State
- Hackathon flow uses the custom UI for Soundscape + Avatar Studio, with native Scope UI as fallback.
- Custom UI uses the Scope WebRTC offer flow (`/api/v1/webrtc/*`) for prompt-driven streaming (VACE optional when asset paths are available).
- Avatar Studio uses `input_mode: "video"` and sends webcam video via WebRTC, with Apply Updates pushing prompt/VACE changes over the data channel (`reset_cache: true`).
- Reference image uploads are preview-only; VACE uses Scope asset paths for now.

## Project References

| Document | Description |
|----------|-------------|
| `../api-reference.md` | Comprehensive API reference (local copy) |
| `../workflows-reference.md` | WebRTC, VACE, LoRA, Spout workflows |
| `../scope-platform-reference.md` | Platform overview and architecture |
| `../scope-technical.md` | Project-specific technical decisions |
| `../research.md` | Research findings and validation notes |
