# Daydream Scope Platform Reference

**Last Modified**: 2025-12-27 14:00 EST
**Source**: Official Daydream documentation (docs.daydream.live/scope)
**Status**: Canonical Reference

## Purpose

Comprehensive platform documentation for Daydream Scope, extracted from official sources. This serves as the authoritative reference for Scope capabilities, deployment, and usage within the MetaDJ Scope project.

---

## What is Daydream Scope?

Daydream Scope is an open-source tool for running and customizing real-time interactive generative AI pipelines and models. It enables:

- **Stream real-time AI-generated video** via WebRTC with low latency
- **Interactive timeline editor** to modify generation parameters on the fly
- **Multi-modal inputs** including text prompts, videos, camera feeds, and more
- **State-of-the-art video diffusion models** experimentation

**Status**: Currently in alpha. Expect some rough edges as the team iterates with the open-source AI community.

---

## Supported Pipelines

Scope supports three primary autoregressive video diffusion models:

### Pipeline Comparison

| Pipeline | Description | VACE Support | Min VRAM | Best For |
|----------|-------------|--------------|----------|----------|
| **StreamDiffusion V2** | Real-time video generation with streaming capabilities | TBD | 24GB | General-purpose real-time generation |
| **LongLive** | Extended generation for longer video sequences with consistent quality | **Yes** | 24GB | Identity-consistent avatars, character work |
| **Krea Realtime** | Text-to-video with real-time streaming | **No** | 32GB (40GB recommended) | Photorealistic portraits |

### Pipeline Details

#### StreamDiffusion V2
- **Output**: Balanced between stylized and realistic
- **VRAM**: 24GB minimum, CUDA 12.8+
- **Use Case**: General-purpose real-time video generation with immediate visual feedback

#### LongLive (Recommended for MetaDJ)
- **Output**: Stylized/artistic generation
- **VRAM**: 24GB minimum
- **VACE**: Fully supported with reference images
- **Use Case**: Character-consistent generation where identity preservation matters more than photorealism
- **Trade-off**: More stylized output, but maintains identity lock via VACE

#### Krea Realtime
- **Output**: Photorealistic, natural-looking
- **VRAM**: 32GB minimum (40GB+ recommended for higher resolutions)
- **Quantization**: Can run on 32GB with fp8 at lower resolutions
- **VACE**: NOT supported - no identity consistency controls
- **Use Case**: Realistic portraits where photorealism matters more than identity consistency
- **Trade-off**: Beautiful realistic output, but no identity lock

#### Passthrough
- **Output**: None (passes video through unchanged)
- **VRAM**: Minimal
- **Use Case**: Testing camera setup, debugging pipeline issues

#### Reward Forcing
- **Output**: Experimental
- **Description**: Uses reward-based alignment techniques
- **Use Case**: Research and experimentation (not recommended for production)

---

## Deployment Options

### Local Installation

**Best for**: Users with high-end NVIDIA GPUs who want maximum performance and full control.

#### System Requirements
| Requirement | Minimum | Recommended |
|-------------|---------|-------------|
| **OS** | Linux or Windows | Linux |
| **GPU** | NVIDIA RTX 4090 or similar | RTX 5090 |
| **VRAM** | 24GB | 32GB+ (for Krea Realtime) |
| **CUDA** | 12.8+ | Latest stable |

#### Installation Steps

1. **Verify GPU drivers**:
   ```bash
   nvidia-smi
   ```
   Output should show CUDA version >= 12.8.

2. **Install dependencies**:
   - UV (Python package manager)
   - Node.js and npm

3. **Clone the repository**:
   ```bash
   git clone git@github.com:daydreamlive/scope.git
   cd scope
   ```

4. **Build frontend and install Python dependencies**:
   ```bash
   uv run build
   ```
   First-time install may take a while as dependencies are downloaded and compiled.

5. **Start the Scope server**:
   ```bash
   uv run daydream-scope
   ```
   On first run, model weights download automatically to `~/.daydream-scope/models`.

6. **Access the UI**:
   Open browser to http://localhost:8000

### Cloud Deployment (RunPod)

**Best for**: Researchers and developers without access to local high-end GPUs.

#### Prerequisites
- RunPod account with credits
- HuggingFace account with read token

#### Deployment Steps

1. **Access the Daydream Scope template**:
   https://runpod.io/console/deploy?template=daydream-scope

2. **Create a HuggingFace token**:
   - Go to https://huggingface.co/settings/tokens
   - Create token with **read** permissions
   - Note: HuggingFace integration provides 10GB free streaming/month via Cloudflare TURN servers

3. **Select GPU**:
   - Minimum: >= 24GB VRAM
   - Recommended: NVIDIA RTX 4090/5090
   - Drivers: CUDA 12.8+ support

4. **Configure environment variables**:
   - Click "Edit Template"
   - Add: `HF_TOKEN` = your HuggingFace token
   - Click "Save"

5. **Deploy**:
   - Click "Deploy On-Demand"
   - Wait for deployment (few minutes)

6. **Access your instance**:
   - URL format: `https://your-instance-id.runpod.io:8000`

---

## Using Scope

### First Run Experience

When you first open Scope:
- **Default mode**: Video mode with a looping cat test video
- **Default prompt**: "a dog walking in grass"
- **Expected speed**: ~8 FPS (varies by hardware)

Try updating the prompt in real-time:
- "a cow walking in grass"
- "a dragon flying through clouds"
- "a robot walking on mars"

### Key Features

#### Video Mode
Apply prompts to static test videos. Perfect for experimenting and understanding how Scope transforms video content.

#### Camera Mode
Connect a camera to use live camera feeds as input. Enables real-time interactive experiences with AI transformations happening live.

#### Interactive Timeline Editor
Scope's most powerful feature - modify generation parameters over time:
- Replay example generations
- Modify prompts at different points in the timeline
- Steer generation in different directions
- Import/export timeline files for reproducible workflows

#### Custom Prompts
Swap in different characters, scenes, styles, or entirely new concepts. Scope supports rich text-based controls for fine-tuning generations.

#### Model Parameter Controls
Access to various model parameters for fine-tuning generation behavior. Experiment to achieve different effects and optimize for your use case.

---

## Troubleshooting

### Local Installation Issues

| Issue | Solution |
|-------|----------|
| CUDA version mismatch | Run `nvidia-smi` and verify >= 12.8. Update NVIDIA drivers. |
| Build fails | Ensure UV, Node.js, npm properly installed. Try `uv cache clean && uv run build` |
| `Python.h: No such file` | Install python3-dev: `sudo apt-get install python3-dev` |
| Models won't download | Check internet connection, verify disk space in ~/.daydream-scope/models |

### RunPod Deployment Issues

| Issue | Solution |
|-------|----------|
| Can't connect to UI | Verify instance fully deployed, access port 8000, check HF_TOKEN set |
| Poor streaming | Try more powerful GPU, check internet speed |
| WebRTC fails | Verify HF_TOKEN has read permissions, try redeploying |

---

## External Resources

### Official Documentation
- **Scope GitHub**: https://github.com/daydreamlive/scope/
- **Scope Docs**: https://docs.daydream.live/scope/introduction
- **Quick Start**: https://docs.daydream.live/scope/getting-started/quickstart
- **System Requirements**: https://docs.daydream.live/scope/reference/system-requirements

### Community
- **Discord**: https://discord.com/invite/5sZu8xmn6U (#scope channel)
- **GitHub Discussions**: https://github.com/daydreamlive/scope/discussions

### Templates & Tools
- **RunPod Template**: https://runpod.io/console/deploy?template=daydream-scope
- **HuggingFace Tokens**: https://huggingface.co/settings/tokens

---

## Related Documentation

- `api-reference.md` - Complete API documentation
- `workflows-reference.md` - WebRTC, VACE, LoRA, Spout workflows
- `scope-technical.md` - Project-specific technical decisions
- `research.md` - Research findings and validation notes
