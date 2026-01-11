# Research - MetaDJ Scope

**Last Modified**: 2026-01-10 15:37 EST
**Status**: Active Collection

## Purpose
Collect research findings, API discoveries, and technical notes during hackathon exploration. Canonical platform docs live in the external references hub.

**Canonical External References**:
- `1-system/3-docs/external/ai/daydream/daydream-scope.md` — Scope platform reference
- `1-system/3-docs/external/ai/daydream/streamdiffusion.md` — StreamDiffusion reference

---

## Current Focus
- Scope-generated MetaDJ avatar from live webcam input
- VACE for identity consistency
- ControlNet for pose guidance
- Future: masking/segmentation for clean overlay, background environments

---

## Technical Baseline (From MetaDJ Nexus)

**Key advantage**: Z has production experience with StreamDiffusion via MetaDJ Nexus Dream feature. The Scope hackathon builds on this foundation.

### What We Know Works
| Parameter | Value | Source |
|-----------|-------|--------|
| Model | `stabilityai/sd-turbo` | Nexus production |
| Resolution | 512×512 | Nexus production |
| Steps | 25 | Nexus tuned |
| Guidance | 1.0 | Nexus tuned |
| Delta | 0.7 | Nexus tuned |
| ControlNets | SD2.1 set | Nexus validated |
| Warm-up | 15-25s | Nexus observed |

### Detailed Reference
See `docs/nexus-daydream-reference.md` for:
- Full production payload
- ControlNet scales
- Dynamic parameter list
- Type definitions
- WHIP client patterns

---

## Scope Platform Research

See `1-system/3-docs/external/ai/daydream/daydream-scope.md` for a general capability overview. This section captures findings and validation notes.

### API Endpoints (Validated Dec 28)
*Source: official Scope server docs (`docs/server.md`).*

| Endpoint | Method | Purpose | Notes |
|----------|--------|---------|-------|
| `/health` | GET | Health check | - |
| `/docs` | GET | Swagger UI | - |
| `/api/v1/hardware/info` | GET | Hardware info | - |
| `/api/v1/pipeline/load` | POST | Load pipeline | - |
| `/api/v1/pipeline/status` | GET | Pipeline status | - |
| `/api/v1/pipelines/schemas` | GET | Pipeline schemas | - |
| `/api/v1/models/status` | GET | Model download status | - |
| `/api/v1/models/download` | POST | Download models | - |
| `/api/v1/webrtc/ice-servers` | GET | ICE server config | - |
| `/api/v1/webrtc/offer` | POST | WebRTC offer | - |
| `/api/v1/webrtc/offer/{session_id}` | PATCH | Trickle ICE | - |
| `/api/v1/assets` | GET/POST | Asset list/upload | - |
| `/api/v1/assets/{path}` | GET | Asset file | - |
| `/api/v1/lora/list` | GET | LoRA list | - |

### Unverified Hackathon Endpoints
The hackathon notes referenced `/v1/streams` endpoints, but these do not appear in the official `server.md`. Treat them as unverified/legacy until confirmed on a live server.

### VACE Capabilities (Key Differentiator)
- Reference image support for style/character consistency
- **Critical for MetaDJ Avatar direction**
- See: https://github.com/daydreamlive/scope/blob/main/docs/api/vace.md

**VACE Questions - Validated Dec 26:**
- [x] How are reference images provided? → **Upload via UI "Reference Images" section**
- [ ] What's the latency impact of VACE? → TBD (needs measurement)
- [x] How consistent is character preservation? → **Works well with proper reference images**
- [x] Can multiple reference images be used? → **Yes, UI supports multiple**
- [x] Does VACE work with all models or specific ones? → **Pipeline-dependent! See below**

### Pipeline VACE Compatibility (Validated Dec 26)

**Critical Discovery**: VACE is NOT available on all pipelines!

| Pipeline | VACE Support | Validated |
|----------|-------------|-----------|
| `longlive` | ✅ **Yes** | Dec 26 |
| `krea-realtime-video` | ❌ **No** | Dec 26 |
| `streamdiffusionv2` | ❓ TBD | - |
| `reward-forcing` | ❓ TBD | - |
| `passthrough` | N/A | - |

**Evidence**: When switching to `krea-realtime-video`, the VACE toggle and Reference Images section disappear from the Settings panel. This is by design—the Wan2.1-T2V-1.3B model used by krea-realtime-video does not support VACE embeddings.

**Implication for MetaDJ**: Must use `longlive` pipeline if identity consistency via VACE is required.

---

## Technical Findings

### RunPod Setup (Documented Dec 26)

**Prerequisites:**
- RunPod account with credits ($20 provides ~45 hours on RTX 4090 at ~$0.44/hr)
- HuggingFace account with read token

**Deployment Steps:**

1. **Access the Daydream Scope Template**
   - Template URL: https://runpod.io/console/deploy?template=daydream-scope
   - This loads the pre-configured Scope template automatically

2. **Create a HuggingFace Token** (required for TURN server)
   - Go to https://huggingface.co
   - Navigate to **Settings → Access Tokens**
   - Click **New token** with **read** permissions
   - Copy the token
   - Note: HuggingFace integration provides **10GB free streaming/month** via Cloudflare TURN servers

3. **Select GPU**
   | Requirement | Value |
   |-------------|-------|
   | Minimum | ≥24GB VRAM |
   | Recommended | NVIDIA RTX 4090/5090 |
   | Drivers | CUDA 12.8+ support |

4. **Configure Environment Variables**
   - Click **"Edit Template"** in RunPod interface
   - Find the environment variables section
   - Add: `HF_TOKEN` = your HuggingFace token
   - Click **"Save"**

5. **Deploy Your Instance**
   - Click **"Deploy On-Demand"**
   - Wait for deployment (few minutes as it downloads model weights)

6. **Access Your Scope Instance**
   - RunPod provides a URL once ready
   - Open at **port 8000**: `https://your-instance-id.runpod.io:8000`

**First Run Expectations:**
- Default mode: Video mode with looping cat test video
- Default prompt: "a dog walking in grass"
- Expected speed: ~8 FPS (varies by hardware)
- Try prompts: "a cow walking in grass", "a dragon flying through clouds", "a robot walking on mars"

**Troubleshooting:**

| Issue | Solution |
|-------|----------|
| Can't connect to UI | Verify instance fully deployed, access port 8000, check `HF_TOKEN` set |
| Poor streaming | Try more powerful GPU, check internet speed, TURN server helps but network varies |
| WebRTC fails | Verify `HF_TOKEN` has read permissions, check env vars, try redeploying |

- [x] RunPod deployment steps
- [x] Environment configuration (HF_TOKEN)
- [x] Instance deployed (Dec 26)
- [ ] First stream creation test

### Active RunPod Instance (Updated Dec 27)

| Property | Value |
|----------|-------|
| **Pod Name** | metadj-scope |
| **Pod ID** | `t68d6nv3pi7uia` |
| **GPU** | RTX Pro 6000 (96GB VRAM) |
| **Cost** | $1.84/hr (On-Demand) |
| **Template** | Daydream Scope (daydreamlive/scope) |
| **Scope UI** | `https://t68d6nv3pi7uia-8000.proxy.runpod.net` |
| **Console** | https://console.runpod.io/pods?id=t68d6nv3pi7uia |

**Note**: Upgraded from RTX 5090 (32GB) on Dec 27 after encountering CUDA OOM errors when switching pipelines. The RTX Pro 6000 provides 96GB VRAM—massive headroom for all pipelines.

**Environment Variables Configured:**
- `HF_TOKEN` - HuggingFace read token for TURN server

**Next Steps:**
1. Verify instance is fully initialized
2. Access Swagger UI at `/docs` endpoint
3. Test first stream creation
4. Validate VACE with MetaDJ avatar reference image

### Pipeline-Specific Findings (Dec 26)

#### All Models Downloaded ✅
All 5 pipeline models have been downloaded on the `metadj-scope` RunPod instance and are ready for immediate use:

| Pipeline ID | Status | Description |
|-------------|--------|-------------|
| `longlive` | ✅ Downloaded | Stylized output with VACE support |
| `krea-realtime-video` | ✅ Downloaded | Photorealistic (no VACE) |
| `streamdiffusionv2` | ✅ Downloaded | General-purpose |
| `reward-forcing` | ✅ Downloaded | Experimental alignment |
| `passthrough` | ✅ Ready | No model needed |

**Benefit**: No first-run download delays—switch between pipelines instantly.

#### `longlive` Pipeline
- **Output**: Stylized/artistic generation
- **VACE**: Fully supported
- **VRAM**: ~20GB (confirmed on RTX 5090)
- **Model Download**: ~10GB on first use
- **Best for**: Identity-consistent character generation
- **Trade-off**: More stylized than photorealistic

#### `krea-realtime-video` Pipeline
- **Output**: Photorealistic, natural-looking
- **VACE**: NOT supported (controls hidden in UI)
- **VRAM**: 32GB (uses Wan-AI/Wan2.1-T2V-1.3B)
- **Model Download**: ~15GB on first use, takes 3-7 minutes
- **Model Initialization**: Additional 1-3 minutes to load into VRAM after download
- **Best for**: Realistic portraits where identity consistency is not needed
- **Trade-off**: Beautiful realistic output, but no identity lock

#### `passthrough` Pipeline
- **Output**: None (passes video through unchanged)
- **Best for**: Testing camera setup before running generation
- **Use case**: Debug webcam input before switching to generation pipelines

### Performance Observations
*To be documented after testing*

| Metric | Nexus (Reference) | Scope (Measured) |
|--------|-------------------|------------------|
| Warm-up time | 15-25s | TBD |
| Inference latency | ~100ms/frame | TBD |
| VACE latency | N/A | TBD |
| Memory usage | - | 20GB (longlive), 32GB (krea) |

### Integration Discoveries

#### TouchDesigner Integration (Dec 27)

**Critical Discovery**: Spout requires **Windows** - not available on RunPod (Linux).

| Integration Path | Platform | Latency | Notes |
|------------------|----------|---------|-------|
| Spout | Windows only | Near-zero | GPU memory sharing |
| NDI | Cross-platform | Low (LAN) | Network video protocol |
| WebRTC | Cross-platform | Variable | Browser-based |

**TouchDesigner Key Points:**
- **Operator Families**: TOPs (textures), CHOPs (channels), SOPs (3D), DATs (data), MATs (materials), COMPs (components), POPs (points)
- **Spout Operators**: Syphon Spout In TOP, Syphon Spout Out TOP
- **GPU Requirement**: NVIDIA or AMD required for Spout (Intel not supported)
- **Default Limit**: 10 Spout senders per computer
- **AI/ML Options**: Script TOP (NumPy/OpenCV), NVIDIA Background TOP (segmentation)

**Scope Spout Config:**
- **Receiver**: Input Mode = Video, Video Source = Spout Receiver, Sender Name = [app name]
- **Sender**: Toggle Spout Sender ON, default name = "ScopeOut"

**Implication for MetaDJ Scope Hackathon:**
- RunPod deployment cannot use Spout directly
- TouchDesigner integration requires separate Windows machine
- Current approach: WebRTC to browser is correct for hackathon
- Future: Local Windows Scope + TouchDesigner for post-production workflows

- [x] Spout output setup (documented in touchdesigner-reference.md)
- [x] External tool connectivity (TouchDesigner, Unity, Blender documented)
- [ ] Desktop app vs API differences

---

### Strategic Architecture Insights (Dec 27)

**How Daydream Positions Scope:**
- Primary: "Interactive tool with UI" (the main product)
- Secondary: "API to programmatically control Scope" (advanced use case)
- Not pitched as: "Build your AI video app on Scope as a backend"

**The Stack (Bottom to Top):**
1. **RunPod** - Just hardware (GPU hosting, container runtime, network proxy)
2. **Underlying Models** - StreamDiffusion V2, LongLive, Krea Realtime, etc.
3. **Scope Application** - Pipeline management, WebRTC server, UI, asset management
4. **Scope API** - REST + WebRTC endpoints (what custom apps talk to)
5. **Your App/Browser** - Either native Scope UI or custom frontend

**Key Clarifications:**
- Scope API ≠ StreamDiffusion API (Scope wraps it)
- Scope API ≠ RunPod API (RunPod just hosts)
- The API is "remote control" - not extension/plugin development
- Same backend whether using Scope UI or custom app

**Custom App Opportunity:**
- Your app → API calls → Your RunPod GPU → AI output
- Users interact with YOUR interface while YOUR rented GPU does AI work
- Challenges: Authentication (none by default), cost model, scaling, uptime

**Full details in:** `docs/future-integration-strategy.md`

---

## MetaDJ Relevance

### Connection to Dream Engine
- **Same underlying tech**: Scope uses StreamDiffusion, same as Nexus Dream
- **Proven patterns**: ControlNet config, timing, prompts transfer directly
- **Code potential**: Some patterns may port to Scope integration

### Connection to MetaDJ Studio
- Virtual stage visuals could use Scope
- Performance-driven AI video generation
- Avatar/character consistency via VACE
- Spout output could feed Unity-based stage

### Unique Positioning
- Z's production experience with StreamDiffusion
- Existing MetaDJ visual identity to leverage
- DJ/performance narrative angle
- Brand assets (avatar images) ready for VACE testing

---

## Workshop Notes

### Dec 22 - Kickoff
*Add notes here*

### Dec 23 - Workshop #1 (Scope Fundamentals)
*Add notes here*
- Desktop app walkthrough
- API introduction
- Key concepts

### Dec 26 - Workshop #2 (Spout Integration)
*Add notes here*
- Spout setup
- Tool connectivity
- Integration patterns

---

## Open Questions

*Note: Many original questions have been answered through research. See validated sections above for answered items.*

### Remaining API Questions
- [ ] Is the API structure identical to Daydream hosted API?
- [ ] Does WHIP work the same way as Nexus?

### Performance (To Measure)
- [ ] RunPod warm-up time for each pipeline?
- [ ] Real-time viability for live demo?
- [ ] VACE latency impact on frame rate?

### Future Integration
- [ ] Simplest web UI integration path (validated approach: use Scope UI for hackathon)?
- [ ] Can we reuse Nexus patterns for custom WebRTC client?

### Masking / Segmentation (Post-Hackathon)
- [ ] Does Scope expose segmentation or alpha output?
- [ ] Is SAM3 available as a pipeline module?
- [ ] If mask is possible, what format is returned?

---

## External Resources Reviewed
- [x] Scope GitHub README (Dec 27)
- [x] Scope introduction docs (Dec 27)
- [x] Scope API server docs (Dec 27)
- [x] VACE documentation (Dec 27)
- [x] RunPod quickstart (Dec 26 - full deployment steps documented above)
- [x] RunPod documentation deep dive (Dec 27 - Pods, GPUs, storage, networking, pricing, SDK, CLI)
- [x] TouchDesigner documentation (Dec 27 - operators, families, glossary, modes)
- [x] TouchDesigner Spout operators (Dec 27 - Syphon Spout In/Out TOPs)
- [x] TouchDesigner AI/ML TOPs (Dec 27 - Script TOP, NVIDIA Background TOP)
- [x] Spout framework (Dec 27 - GPU texture sharing, compatibility)
- [x] NDI documentation (Dec 27 - network video protocol)
- [x] Scope Spout integration docs (Dec 27 - Windows requirement, sender/receiver config)
- [ ] FAQ document
- [x] MetaDJ Nexus Daydream docs (internal reference)

**Canonical documentation** lives in `1-system/3-docs/external/ai/daydream/` and official Scope docs. Project deltas live here:
- `docs/scope-platform-reference.md` - Project delta notes
- `docs/api-reference.md` - Project delta API usage
- `docs/workflows-reference.md` - Project delta workflow notes
- `docs/runpod-reference.md` - Project delta deployment notes
- `docs/touchdesigner-reference.md` - Project delta integration notes
- `docs/future-integration-strategy.md` - Post-hackathon strategy (custom apps, architecture layers, cost analysis)

---

## Notes
- Update this document as research progresses
- Link to specific code examples or gists discovered
- Cross-reference with `ideas.md` as concepts emerge
- Cross-reference with `nexus-daydream-reference.md` for baseline
