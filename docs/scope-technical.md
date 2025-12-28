# Scope Technical Overview

**Last Modified**: 2025-12-27 22:00 EST
**Status**: Active

## Purpose
Provide a comprehensive technical reference for Scope capabilities, pipelines, and integration options. This document is not project-specific; project decisions live in `docs/strategy.md`, `docs/architecture.md`, and `docs/features/avatar-mvp-spec.md`.

---

## Scope Platform Capabilities

Scope is a real-time AI video generation platform built on StreamDiffusion. Core capabilities include:

- **Real-time AI video generation** via StreamDiffusion-based pipelines
- **VACE (Video Anything Concept Engine)** for reference image guidance and identity consistency
- **Multiple pipeline options** with different output characteristics
- **Web-based UI** for interactive control (accessible via RunPod or local deployment)
- **API server** for programmatic control
- **Spout integration** for tool chaining (Unity, TouchDesigner, etc.)
- **LoRA adapter support** for custom model fine-tuning

---

## Pipeline Options (Validated Dec 26)

Scope provides five pipeline options, each with different characteristics and trade-offs:

### Pipeline Comparison Matrix

| Pipeline | Output Style | VACE Support | VRAM Required | Best For |
|----------|--------------|--------------|---------------|----------|
| `longlive` | Stylized/Artistic | **Yes** | ~20GB | Identity-consistent avatars, character work |
| `krea-realtime-video` | Photorealistic | No | 32GB | Realistic portraits, natural looks |
| `streamdiffusionv2` | Balanced | TBD | ~20GB | General-purpose generation |
| `reward-forcing` | Experimental | TBD | TBD | Alignment experiments |
| `passthrough` | None (pass-through) | N/A | Minimal | Testing, debugging |

### Detailed Pipeline Descriptions

#### `longlive` (Recommended for MetaDJ Avatar)
- **Output**: Stylized, artistic generation
- **VACE**: Fully supported with reference images
- **VRAM**: ~20GB required
- **Models**: Downloads on first use
- **Best for**: Character-consistent generation where identity preservation matters more than photorealism
- **Trade-off**: More stylized/artistic output, but maintains identity lock via VACE

#### `krea-realtime-video`
- **Output**: Photorealistic, natural-looking
- **VACE**: **Not supported** - no identity consistency controls
- **VRAM**: 32GB required (uses Wan-AI/Wan2.1-T2V-1.3B model)
- **Models**: Wan2.1-T2V-1.3B (~1.3B parameters)
- **Best for**: Realistic portraits where photorealism matters more than identity consistency
- **Trade-off**: Beautiful realistic output, but no identity lock - output varies based on prompt only

#### `streamdiffusionv2`
- **Output**: Balanced between stylized and realistic
- **VACE**: TBD (requires validation)
- **VRAM**: ~20GB estimated
- **Best for**: General-purpose generation
- **Trade-off**: Jack of all trades, master of none

#### `reward-forcing`
- **Output**: Experimental
- **Description**: Uses reward-based alignment techniques
- **Best for**: Research and experimentation
- **Note**: Not recommended for production demos

#### `passthrough`
- **Output**: None - passes video through unchanged
- **Best for**: Testing camera setup, debugging pipeline issues
- **Note**: Useful for validating webcam input before running generation

---

## VACE (Video Anything Concept Engine)

VACE is the key differentiator for identity-consistent generation. **Critical: VACE is only available on certain pipelines.**

### VACE-Enabled Pipelines
- `longlive` - **Confirmed working**
- `streamdiffusionv2` - TBD

### VACE NOT Available
- `krea-realtime-video` - Does not expose VACE controls
- `passthrough` - N/A (no generation)
- `reward-forcing` - TBD

### VACE Configuration
When using a VACE-enabled pipeline:

1. **Reference Images**: Upload one or more reference images in the "Reference Images" section
2. **VACE Toggle**: Enable VACE in the Settings panel (ON/OFF)
3. **Scale Control**: Adjust VACE strength (range 0.0-2.0, default 1.0)

### VACE Scale Guide (Validated Dec 27)

| Scale | Effect | Use Case |
|-------|--------|----------|
| **0.0** | No reference influence | Pure text-to-video generation |
| **0.5** | Subtle influence | Creative freedom with light identity hints |
| **1.0** | Default balanced | Standard identity conditioning |
| **1.5** | Strong identity lock | Character-consistent avatars |
| **2.0** | Maximum identity lock | Strongest reference enforcement |

### Optimal MetaDJ Avatar Settings (Validated Dec 27)

**Recommended configuration for MetaDJ avatar transformation:**

| Setting | Value | Rationale |
|---------|-------|-----------|
| **Pipeline** | `longlive` | Only pipeline with VACE support |
| **VACE** | ON | Required for identity consistency |
| **VACE Scale** | **1.5-2.0** | Higher values enforce stronger identity lock |
| **Input Mode** | Video (Camera) | For real-time webcam input |
| **Resolution** | 320x576 | Default, good performance/quality balance |
| **Prompt** | MetaDJ-specific descriptors | Reinforce identity (see prompt section) |

**Key Finding**: Scale 1.0 (default) produces weak identity transfer. For strong avatar consistency, use **Scale 1.5-2.0**. At Scale 2.0, the reference image's key visual elements (goggles, visor, aesthetic) come through consistently across frames.

### VACE Best Practices
- Use high-quality, well-lit reference images
- Multiple angles help with consistency
- Front-facing images work best for avatar work
- **Use Scale 1.5-2.0 for identity-critical work** (updated from previous guidance)
- For maximum identity lock, use Scale 2.0 with identity-reinforcing prompts

---

## Resolution & Performance Guide (Validated Dec 27)

Resolution is the **primary factor** affecting FPS. The GPU runs at 100% regardless—lower resolution means each frame computes faster.

### Daydream Default Resolutions (Official)

| Pipeline | Default (H×W) | Aspect |
|----------|---------------|--------|
| `longlive` | 576 × 320 | 9:16 Portrait |
| `streamdiffusionv2` | 512 × 512 | 1:1 Square |
| `krea-realtime-video` | 512 × 512 | 1:1 Square |

*Source: Scope API documentation*

### Resolution vs FPS (Our Observations)

**Note**: FPS values below are from our testing on RTX Pro 6000 (96GB). Actual FPS varies significantly by GPU, pipeline, and settings. Daydream docs cite "~8 FPS (varies by hardware)" as a general baseline.

| Resolution | Aspect | Pixels | Observed FPS* | Use Case |
|------------|--------|--------|---------------|----------|
| 320 × 576 | 9:16 (Portrait) | 184K | ~15-20 | **Daydream default** for longlive |
| 512 × 512 | 1:1 (Square) | 262K | ~12-15 | Daydream default for krea/streamdiffusion |
| **640 × 360** | 16:9 (Landscape) | 230K | **~10-15** | **Recommended for 16:9 demos** |
| 512 × 288 | 16:9 (Landscape) | 147K | ~15-20 | Maximum FPS, smaller output |
| 768 × 432 | 16:9 (Landscape) | 332K | ~8-12 | Higher quality, slower |
| 1280 × 720 | 16:9 (Landscape) | 922K | ~4-5 | **Too slow for real-time** |

*\*Observed on RTX Pro 6000 with longlive pipeline. Your results will vary.*

### Key Insights

1. **100% GPU ≠ fast FPS**: Full GPU utilization means it's compute-bound. Each frame takes X ms regardless of utilization percentage.

2. **Pixel count matters most**: 1280×720 has 4× more pixels than 640×360, so it runs ~4× slower.

3. **Aspect ratio flexibility**: Scope accepts any resolution. Match your output target:
   - 16:9 for standard video/streaming
   - 9:16 for mobile/TikTok-style
   - 1:1 for social media squares

4. **Quality vs Speed trade-off**: For hackathon demo, 640×360 at 10-15 FPS looks better than 1280×720 at 4 FPS (stuttery).

### Recommended Settings by Use Case

| Use Case | Resolution | Expected FPS |
|----------|------------|--------------|
| Real-time demo (16:9) | 640 × 360 | 10-15 |
| Real-time demo (portrait) | 320 × 576 | 15-20 |
| High-quality recording | 768 × 432 | 8-12 |
| Maximum smoothness | 512 × 288 | 15-20 |

### Other Performance Factors

| Factor | Impact | Recommendation |
|--------|--------|----------------|
| **Denoising Steps** | High values (1000+) slow inference | Use pipeline defaults |
| **Quantization** | `fp8` reduces precision for speed | Try if FPS is critical |
| **VACE Scale** | Minimal FPS impact | Use 1.5-2.0 for identity |
| **Manage Cache** | ON improves consistency | Keep ON |

---

## UI Controls Reference

### Input & Controls Panel (Left)

| Control | Options | Description |
|---------|---------|-------------|
| **Input Mode** | Text, Video | Text = prompt-only generation; Video = webcam/file input |
| **Video Source** | Video File, Camera | Only shown when Input Mode = Video |
| **Reference Images** | Add Image | Upload reference images for VACE (pipeline-dependent) |
| **Prompts** | Text + Weight | Multiple prompts supported with individual weights |
| **Temporal Blend** | Slerp, Linear | Interpolation method between frames |
| **Transition Steps** | 0-10 | Smoothness of transitions |

### Settings Panel (Right)

| Control | Description | Pipeline-Dependent |
|---------|-------------|-------------------|
| **Pipeline ID** | Select generation pipeline | No |
| **VACE** | Toggle identity consistency (ON/OFF) | Yes - only on supported pipelines |
| **Scale** | VACE strength when enabled | Yes |
| **LoRA Adapters** | Add custom model adapters | Partially |
| **Height/Width** | Output resolution | No |
| **Seed** | Random seed for reproducibility | No |
| **Cache Bias** | Memory optimization | Pipeline-specific |
| **Manage Cache** | Enable/disable caching | No |
| **Denoising Steps** | Quality vs speed trade-off | Pipeline-specific |

### Pipeline-Specific Settings

**longlive Pipeline:**
- VACE controls visible and functional
- Standard denoising options
- LoRA support available

**krea-realtime-video Pipeline:**
- No VACE controls (section hidden)
- Cache Bias slider visible
- Denoising Step List (Steps 1-4) visible
- Quantization option (fp8)

---

## Prompt Engineering

### For Identity-Consistent Avatars (longlive + VACE)
```
MetaDJ avatar, cyberpunk DJ, neon purple and cyan lighting,
futuristic digital art style, high quality
```
- Stylized descriptors work well
- Character/avatar terminology reinforces identity
- Lighting and atmosphere enhance the aesthetic

### For Photorealistic Output (krea-realtime-video)
```
DJ portrait, professional studio lighting, cinematic,
photorealistic, purple and cyan accent lighting, high detail, 8k
```
- Photography terminology (portrait, studio lighting, cinematic)
- Technical quality descriptors (8k, high detail)
- Realistic lighting descriptions

### Multi-Prompt Blending
Scope supports multiple prompts with individual weights:
- **Prompt 1**: Primary style/subject (e.g., "cyberpunk DJ portrait")
- **Prompt 2**: Atmosphere/modifiers (e.g., "neon lighting, dark background")
- **Weights**: Adjust to blend (e.g., 60%/40%)
- **Spatial Blend**: Linear or other interpolation modes

---

## Hardware Requirements

### Minimum
- GPU with 24GB VRAM
- CUDA 12.8+ support
- NVIDIA RTX 4090 or equivalent

### Recommended
- **RTX Pro 6000** (96GB VRAM) - Maximum headroom for all pipelines
- **RTX 5090** (32GB VRAM) - Minimum for krea-realtime-video
- High-speed internet for RunPod streaming
- Modern browser with WebRTC support

### VRAM Requirements by Pipeline

| Pipeline | Minimum VRAM | Recommended VRAM |
|----------|--------------|------------------|
| `longlive` | 20GB | 24GB |
| `krea-realtime-video` | 32GB | 32GB |
| `streamdiffusionv2` | 20GB | 24GB |
| `passthrough` | 4GB | 8GB |

---

## Model Downloads

### Current Status (Dec 26, 2025)
**All 5 pipeline models have been downloaded** on the `metadj-scope` RunPod instance and are ready for use:

| Pipeline ID | Status | Notes |
|-------------|--------|-------|
| `longlive` | ✅ Downloaded | Primary for MetaDJ avatar |
| `krea-realtime-video` | ✅ Downloaded | Photorealistic, no VACE |
| `streamdiffusionv2` | ✅ Downloaded | General-purpose |
| `reward-forcing` | ✅ Downloaded | Experimental |
| `passthrough` | ✅ Ready | No model required |

### First-Run Behavior
Each pipeline downloads required models on first use:

| Pipeline | Model | Size | Download Time (Est.) |
|----------|-------|------|---------------------|
| `longlive` | StreamDiffusion models | ~10GB | 2-5 min |
| `krea-realtime-video` | Wan-AI/Wan2.1-T2V-1.3B | ~15GB | 3-7 min |

### Model Initialization
After download, models load into VRAM. This can take 1-3 minutes depending on model size and GPU. The UI shows "Downloading Models... 100%" during initialization.

---

## Integration Paths

### Web UI (Hackathon Default)
- Access via RunPod proxy URL: `https://{pod-id}-8000.proxy.runpod.net`
- Full interactive control
- No code required

### API Server
- REST endpoints for programmatic control
- Swagger UI at `/docs` endpoint
- See: https://github.com/daydreamlive/scope/blob/main/docs/server.md

### Desktop App
- Local interactive control
- Direct GPU access
- See Scope GitHub for installation

### Spout Output (Future)
- Optional routing to external tools
- Unity, TouchDesigner, OBS integration
- See: https://github.com/daydreamlive/scope/blob/main/docs/spout.md

---

## References

### Internal Documentation (Canonical)
- `docs/scope-platform-reference.md` - Complete platform documentation
- `docs/api-reference.md` - Full API reference with code examples
- `docs/workflows-reference.md` - WebRTC, VACE, LoRA, Spout workflows

### External Resources
- **Scope GitHub**: https://github.com/daydreamlive/scope/
- **Scope Docs**: https://docs.daydream.live/scope/introduction
- **Scope API Server Docs**: https://github.com/daydreamlive/scope/blob/main/docs/server.md
- **VACE Docs**: https://github.com/daydreamlive/scope/blob/main/docs/api/vace.md
- **RunPod Template**: https://runpod.io/console/deploy?template=daydream-scope
