# API Notes

**Last Modified**: 2025-12-30 10:57 EST

Central index for Scope API integration notes.

## Current State
- Hackathon flow uses the custom UI for Soundscape + Avatar Studio, with native Scope UI as fallback.
- Custom UI uses the Scope WebRTC offer flow (`/api/v1/webrtc/*`) for prompt-driven streaming (VACE optional when asset paths are available).
- Reference image uploads are preview-only; VACE uses Scope asset paths for now.

## References
- `../scope-technical.md`
- `../research.md`
