# Daydream Scope Platform Reference

**Last Modified**: 2025-12-30 12:45 EST
**Source**: [GitHub Repository](https://github.com/daydreamlive/scope) · [README](https://github.com/daydreamlive/scope/blob/main/README.md)
**Status**: Canonical Reference

## Purpose

Comprehensive platform documentation for Daydream Scope, extracted from official sources. This serves as the authoritative reference for Scope capabilities, deployment, and usage within the MetaDJ Scope project.

### Official Source Links

| Resource | Link |
|----------|------|
| **GitHub Repository** | https://github.com/daydreamlive/scope |
| **README** | [README.md](https://github.com/daydreamlive/scope/blob/main/README.md) |
| **Documentation** | [docs/](https://github.com/daydreamlive/scope/tree/main/docs) |
| **LoRA Guide** | [docs/lora.md](https://github.com/daydreamlive/scope/blob/main/docs/lora.md) |
| **VACE Guide** | [docs/vace.md](https://github.com/daydreamlive/scope/blob/main/docs/vace.md) |
| **Spout Guide** | [docs/spout.md](https://github.com/daydreamlive/scope/blob/main/docs/spout.md) |
| **Contributing** | [docs/contributing.md](https://github.com/daydreamlive/scope/blob/main/docs/contributing.md) |
| **RunPod Template** | https://runpod.io/console/deploy?template=daydream-scope |
| **Discord** | https://discord.com/invite/5sZu8xmn6U |

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
| **StreamDiffusion V2** | Real-time video generation with streaming capabilities | Experimental | 24GB | General-purpose real-time generation |
| **LongLive** | Extended generation for longer video sequences with consistent quality | **Yes** | 24GB | Identity-consistent avatars, character work |
| **Krea Realtime** | Text-to-video with real-time streaming | **No** | 32GB (40GB recommended) | Photorealistic portraits |
| **MemFlow** | Memory-efficient generation with temporal consistency | **Yes** | 24GB | Memory-constrained setups |
| **Reward Forcing** | Reward-based alignment techniques | **Yes** | 24GB | Research and experimentation |

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
- **VACE**: Supported
- **Use Case**: Research and experimentation (not recommended for production)

#### MemFlow
- **Output**: Stylized generation with memory-based consistency
- **VRAM**: 24GB minimum
- **VACE**: Supported
- **Use Case**: Memory-efficient generation with temporal consistency

---

## Codebase Architecture

The Scope project follows a three-tier architecture with Python backend, React frontend, and optional Electron desktop app.

### GitHub Codebase Links

| Component | GitHub Link |
|-----------|-------------|
| **Python Backend** | [src/scope/](https://github.com/daydreamlive/scope/tree/main/src/scope) |
| **Core/Pipelines** | [src/scope/core/pipelines/](https://github.com/daydreamlive/scope/tree/main/src/scope/core/pipelines) |
| **Server (FastAPI)** | [src/scope/server/](https://github.com/daydreamlive/scope/tree/main/src/scope/server) |
| **React Frontend** | [frontend/](https://github.com/daydreamlive/scope/tree/main/frontend) |
| **Frontend Components** | [frontend/src/components/](https://github.com/daydreamlive/scope/tree/main/frontend/src/components) |
| **Frontend Hooks** | [frontend/src/hooks/](https://github.com/daydreamlive/scope/tree/main/frontend/src/hooks) |
| **Electron App** | [app/](https://github.com/daydreamlive/scope/tree/main/app) |
| **pyproject.toml** | [pyproject.toml](https://github.com/daydreamlive/scope/blob/main/pyproject.toml) |
| **CLAUDE.md** | [CLAUDE.md](https://github.com/daydreamlive/scope/blob/main/CLAUDE.md) |

### Repository Structure

```
scope/
├── src/scope/               # Python backend
│   ├── core/                # Core functionality
│   │   ├── pipelines/       # Pipeline implementations
│   │   │   ├── longlive/
│   │   │   ├── streamdiffusionv2/
│   │   │   ├── krea_realtime_video/
│   │   │   ├── reward_forcing/
│   │   │   ├── memflow/
│   │   │   ├── passthrough/
│   │   │   └── wan2_1/      # Base Wan2.1 model
│   │   ├── plugins/         # Plugin system
│   │   └── prompts/         # Prompt management
│   └── server/              # FastAPI server
│       ├── app.py           # Main application
│       ├── webrtc.py        # WebRTC streaming
│       ├── pipeline_manager.py
│       ├── frame_processor.py
│       └── spout/           # Windows Spout integration
├── frontend/                # React web UI
│   └── src/
│       ├── components/      # UI components
│       ├── hooks/           # React hooks
│       ├── pages/           # Page components
│       └── types/           # TypeScript types
├── app/                     # Electron desktop app (Windows)
└── docs/                    # Documentation
```

### Key Backend Modules

| Module | Description |
|--------|-------------|
| `app.py` | FastAPI main application, WebRTC integration, lifespan management |
| `webrtc.py` | Session-based WebRTC streaming with automatic cleanup |
| `pipeline_manager.py` | Pipeline lifecycle, model loading, parameter management |
| `frame_processor.py` | Video frame processing, VACE integration |
| `credentials.py` | TURN server credential handling (Cloudflare via HF_TOKEN) |
| `schema.py` | Pydantic models for API validation |

### Frontend Architecture

| Component | Description |
|-----------|-------------|
| **InputAndControlsPanel** | Main control interface for prompts and settings |
| **SettingsPanel** | Pipeline configuration and model parameters |
| **PromptTimeline** | Timeline-based prompt editing and sequencing |
| **LoRAManager** | LoRA adapter selection and scale management |
| **VideoOutput** | WebRTC video rendering display |

### Custom Hooks

| Hook | Purpose |
|------|---------|
| `useWebRTC` | Manages peer connections and signaling |
| `useStreamState` | Comprehensive streaming session state |
| `usePipeline` | Individual pipeline processing logic |
| `useTimelinePlayback` | Timeline position and playback control |
| `useVideoSource` | Video source selection and configuration |
| `usePromptManager` | Prompt creation and retrieval |

### Technology Stack

**Backend (Python 3.10+)**:
- FastAPI + aiortc for WebRTC
- PyTorch 2.8.0 + torchvision 0.23.0
- Diffusers >= 0.31.0, Transformers >= 4.49.0
- flash-attn, sageattention for optimization
- PEFT for LoRA runtime support

**Frontend**:
- React + TypeScript + Vite
- Tailwind CSS + Radix UI
- Relative API URLs for deployment flexibility

**Desktop App** (Windows only):
- Electron with Vite bundling

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
