# Research - MetaDJ Scope

**Last Modified**: 2025-12-26 16:01 EST
**Status**: Active Collection

## Purpose
Collect research findings, API discoveries, and technical notes during hackathon exploration. General Scope capabilities live in `docs/scope-technical.md`.

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

See `docs/scope-technical.md` for a general capability overview. This section captures findings and validation notes.

### API Endpoints (From Hackathon Docs)
*To be validated against actual Scope API*

| Endpoint | Method | Purpose | Nexus Equivalent |
|----------|--------|---------|------------------|
| `/v1/streams` | POST | Create stream | Same |
| `/v1/streams/:id` | GET | Stream config | Same |
| `/v1/streams/:id/status` | GET | Stream status | Same |
| `/v1/streams/:id` | PATCH | Update params | Same |
| `/v1/streams?id=:id` | DELETE | Tear down | Same |
| WHIP ingest | POST | WebRTC ingest | Same |
| `/docs` | GET | Swagger UI | - |

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

### Active RunPod Instance (Deployed Dec 26)

| Property | Value |
|----------|-------|
| **Pod Name** | metadj-scope |
| **Pod ID** | `gbc63llq1zdxki` |
| **GPU** | RTX 5090 (32GB VRAM) |
| **Cost** | $0.89/hr (On-Demand) |
| **Template** | Daydream Scope (daydreamlive/scope) |
| **API URL** | `https://gbc63llq1zdxki-8000.proxy.runpod.net` |
| **Console** | https://console.runpod.io/pods?id=gbc63llq1zdxki |

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
*To be documented*

- [ ] Spout output setup (optional future overlay/compositing)
- [ ] External tool connectivity (future)
- [ ] Desktop app vs API differences

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

## Questions to Explore

### API & Compatibility
- [x] Does Scope use same StreamDiffusion params as Daydream? → Likely yes (same foundation)
- [ ] Is the API structure identical to Daydream hosted API?
- [ ] Does WHIP work the same way?
- [ ] What's in the Swagger UI (`/docs`)?

### VACE (Critical for Avatar Direction)
- [ ] How to provide reference images?
- [ ] Latency impact?
- [ ] Consistency quality?
- [ ] MetaDJ avatar reference test results?

### Performance
- [ ] RunPod warm-up time?
- [ ] Generation quality at 512×512?
- [ ] Real-time viability for demo?

### Integration
- [ ] Simplest web UI integration path?
- [ ] Spout output complexity (future, optional)?
- [ ] Can we reuse Nexus patterns?

### Masking / Segmentation (Future Overlay)
- [ ] Does Scope expose segmentation or alpha output?
- [ ] Is SAM3 available as a pipeline module?
- [ ] If mask is possible, what format is returned?

---

## External Resources Reviewed
- [ ] Scope GitHub README
- [ ] Scope introduction docs
- [ ] Scope API server docs
- [ ] VACE documentation
- [x] RunPod quickstart (Dec 26 - full deployment steps documented above)
- [ ] FAQ document
- [x] MetaDJ Nexus Daydream docs (internal reference)

---

## Notes
- Update this document as research progresses
- Link to specific code examples or gists discovered
- Cross-reference with `ideas.md` as concepts emerge
- Cross-reference with `nexus-daydream-reference.md` for baseline
