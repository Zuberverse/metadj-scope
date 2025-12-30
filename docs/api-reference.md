# Scope Server API Reference

**Last Modified**: 2025-12-30 12:45 EST
**Source**: [GitHub Repository](https://github.com/daydreamlive/scope) · [Official Docs](https://github.com/daydreamlive/scope/tree/main/docs)
**Status**: Canonical Reference

## Purpose

Complete API documentation for the Daydream Scope server, extracted from official GitHub documentation. This covers all endpoints, workflows, and integration patterns.

### Official Source Links

| Topic | GitHub Link |
|-------|-------------|
| Server API | [docs/api/](https://github.com/daydreamlive/scope/tree/main/docs/api) |
| Pipeline Loading | [docs/api/load.md](https://github.com/daydreamlive/scope/blob/main/docs/api/load.md) |
| Parameters | [docs/api/parameters.md](https://github.com/daydreamlive/scope/blob/main/docs/api/parameters.md) |
| Receive Video | [docs/api/receive.md](https://github.com/daydreamlive/scope/blob/main/docs/api/receive.md) |
| Send & Receive | [docs/api/sendreceive.md](https://github.com/daydreamlive/scope/blob/main/docs/api/sendreceive.md) |
| VACE API | [docs/api/vace.md](https://github.com/daydreamlive/scope/blob/main/docs/api/vace.md) |
| Server Setup | [docs/server.md](https://github.com/daydreamlive/scope/blob/main/docs/server.md) |

---

## Quick Start

Stream video from the Scope API in under 5 minutes.

### Prerequisites
1. Start the Scope server: `uv run daydream-scope`
2. Download models: `uv run download_models --pipeline longlive`

### Minimal HTML Example

```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Scope API Quick Start</title>
  <style>
    body { margin: 0; background: #000; display: flex; justify-content: center; align-items: center; min-height: 100vh; }
    video { max-width: 100%; max-height: 100vh; }
    #status { position: fixed; top: 10px; left: 10px; color: #fff; font-family: monospace; background: rgba(0,0,0,0.7); padding: 10px; border-radius: 4px; }
  </style>
</head>
<body>
  <div id="status">Connecting...</div>
  <video id="video" autoplay muted playsinline></video>
  <script>
    const API_BASE = "http://localhost:8000";
    const statusEl = document.getElementById("status");
    const videoEl = document.getElementById("video");

    async function loadPipeline() {
      statusEl.textContent = "Loading pipeline...";
      await fetch(`${API_BASE}/api/v1/pipeline/load`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pipeline_id: "longlive" })
      });

      while (true) {
        const response = await fetch(`${API_BASE}/api/v1/pipeline/status`);
        const { status } = await response.json();
        if (status === "loaded") break;
        if (status === "error") throw new Error("Pipeline failed to load");
        await new Promise(r => setTimeout(r, 1000));
      }
      statusEl.textContent = "Pipeline loaded";
    }

    async function startStream() {
      const iceResponse = await fetch(`${API_BASE}/api/v1/webrtc/ice-servers`);
      const { iceServers } = await iceResponse.json();

      const pc = new RTCPeerConnection({ iceServers });
      let sessionId = null;
      const queuedCandidates = [];

      const dataChannel = pc.createDataChannel("parameters", { ordered: true });
      dataChannel.onopen = () => { statusEl.textContent = "Connected - Streaming"; };
      dataChannel.onmessage = (event) => {
        const data = JSON.parse(event.data);
        if (data.type === "stream_stopped") {
          statusEl.textContent = "Stream stopped: " + (data.error_message || "Unknown error");
          pc.close();
        }
      };

      pc.addTransceiver("video");
      pc.ontrack = (event) => {
        if (event.streams && event.streams[0]) {
          videoEl.srcObject = event.streams[0];
        }
      };

      pc.onicecandidate = async (event) => {
        if (event.candidate) {
          if (sessionId) {
            await fetch(`${API_BASE}/api/v1/webrtc/offer/${sessionId}`, {
              method: "PATCH",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                candidates: [{
                  candidate: event.candidate.candidate,
                  sdpMid: event.candidate.sdpMid,
                  sdpMLineIndex: event.candidate.sdpMLineIndex
                }]
              })
            });
          } else {
            queuedCandidates.push(event.candidate);
          }
        }
      };

      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);

      const sdpResponse = await fetch(`${API_BASE}/api/v1/webrtc/offer`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sdp: pc.localDescription.sdp,
          type: pc.localDescription.type,
          initialParameters: {
            prompts: [{ text: "A 3D animated scene. A panda walks along a path.", weight: 1.0 }],
            denoising_step_list: [1000, 750, 500, 250],
            manage_cache: true
          }
        })
      });

      const answer = await sdpResponse.json();
      sessionId = answer.sessionId;
      await pc.setRemoteDescription({ type: answer.type, sdp: answer.sdp });

      if (queuedCandidates.length > 0) {
        await fetch(`${API_BASE}/api/v1/webrtc/offer/${sessionId}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            candidates: queuedCandidates.map(c => ({
              candidate: c.candidate,
              sdpMid: c.sdpMid,
              sdpMLineIndex: c.sdpMLineIndex
            }))
          })
        });
      }
    }

    (async () => {
      try {
        await loadPipeline();
        await startStream();
      } catch (error) {
        statusEl.textContent = "Error: " + error.message;
        console.error(error);
      }
    })();
  </script>
</body>
</html>
```

---

## Server Configuration

### Command Line Options

```bash
uv run daydream-scope [OPTIONS]
```

| Option | Default | Description |
|--------|---------|-------------|
| `--host HOST` | 0.0.0.0 | Host to bind to |
| `--port PORT` | 8000 | Port to bind to |
| `--reload` | - | Enable auto-reload for development |
| `-N, --no-browser` | - | Don't open browser automatically |
| `--version` | - | Show version and exit |

### Environment Variables

| Variable | Description |
|----------|-------------|
| `PIPELINE` | Default pipeline to pre-warm on startup |
| `HF_TOKEN` | HuggingFace token for downloading models and Cloudflare TURN |
| `VERBOSE_LOGGING` | Enable verbose logging for debugging |

### Available Pipelines

| Pipeline ID | Default Resolution (HxW) |
|-------------|-------------------------|
| `longlive` | 576x320 |
| `streamdiffusionv2` | 512x512 |
| `krea-realtime-video` | 512x512 (requires 32GB+ VRAM) |
| `reward-forcing` | 576x320 |
| `memflow` | 576x320 |
| `passthrough` | 512x512 |

---

## API Endpoints

### Health & Info

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/health` | GET | Health check |
| `/api/v1/hardware/info` | GET | Get hardware info (VRAM, Spout availability) |
| `/docs` | GET | Interactive API documentation (Swagger UI) |

### Pipeline Management

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/v1/pipeline/load` | POST | Load a pipeline |
| `/api/v1/pipeline/status` | GET | Get current pipeline status |
| `/api/v1/pipelines/schemas` | GET | Get schemas for all available pipelines |

### Model Management

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/v1/models/status` | GET | Check if models are downloaded for a pipeline |
| `/api/v1/models/download` | POST | Start downloading models for a pipeline |

### WebRTC

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/v1/webrtc/ice-servers` | GET | Get ICE server configuration |
| `/api/v1/webrtc/offer` | POST | Send WebRTC offer, receive answer |
| `/api/v1/webrtc/offer/{session_id}` | PATCH | Add ICE candidates (Trickle ICE) |

### Assets

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/v1/assets` | GET | List available assets (images/videos) |
| `/api/v1/assets` | POST | Upload an asset |
| `/api/v1/assets/{path}` | GET | Serve an asset file |

### LoRA

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/v1/lora/list` | GET | List available LoRA files |

---

## Pipeline Loading

### Load a Pipeline

```javascript
async function loadPipeline(pipelineId, loadParams = {}) {
  const response = await fetch("http://localhost:8000/api/v1/pipeline/load", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      pipeline_id: pipelineId,
      load_params: loadParams
    })
  });
  return await response.json();
}

// Load longlive with default settings
await loadPipeline("longlive");

// Load with custom resolution
await loadPipeline("longlive", {
  height: 512,
  width: 512,
  seed: 42
});
```

### Load Parameters

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `height` | int | 320 | Output height (16-2048) |
| `width` | int | 576 | Output width (16-2048) |
| `seed` | int | 42 | Random seed for generation |
| `vace_enabled` | bool | true | Enable VACE |
| `loras` | array | null | LoRA adapters to load |
| `lora_merge_mode` | string | "permanent_merge" | "permanent_merge" or "runtime_peft" |

### Request Body Example

```json
{
  "pipeline_id": "longlive",
  "load_params": {
    "height": 320,
    "width": 576,
    "seed": 42,
    "quantization": null,
    "vace_enabled": true,
    "loras": [
      { "path": "/path/to/lora.safetensors", "scale": 1.0 }
    ],
    "lora_merge_mode": "permanent_merge"
  }
}
```

### Check Pipeline Status

```javascript
async function getPipelineStatus() {
  const response = await fetch("http://localhost:8000/api/v1/pipeline/status");
  return await response.json();
}
```

**Response Format:**
```json
{
  "status": "loaded",
  "pipeline_id": "longlive",
  "load_params": {
    "height": 320,
    "width": 576,
    "seed": 42
  },
  "loaded_lora_adapters": [
    { "path": "/path/to/lora.safetensors", "scale": 1.0 }
  ],
  "error": null
}
```

**Status Values:**
| Status | Description |
|--------|-------------|
| `not_loaded` | No pipeline loaded |
| `loading` | Pipeline is loading (wait and retry) |
| `loaded` | Pipeline ready for streaming |
| `error` | Loading failed (check error field) |

### Wait for Pipeline Ready

```javascript
async function waitForPipelineLoaded(timeoutMs = 300000, pollIntervalMs = 1000) {
  const startTime = Date.now();
  while (Date.now() - startTime < timeoutMs) {
    const status = await getPipelineStatus();
    switch (status.status) {
      case "loaded":
        return status;
      case "loading":
        await new Promise(r => setTimeout(r, pollIntervalMs));
        break;
      case "error":
        throw new Error(`Pipeline load failed: ${status.error}`);
      case "not_loaded":
        throw new Error("Pipeline not loading - was load request sent?");
    }
  }
  throw new Error("Timeout waiting for pipeline to load");
}
```

---

## Real-Time Parameters

After establishing a WebRTC connection, send real-time parameter updates via the data channel.

### Data Channel Setup

```javascript
const dataChannel = pc.createDataChannel("parameters", { ordered: true });

dataChannel.onopen = () => {
  console.log("Data channel ready for parameter updates");
};

dataChannel.onmessage = (event) => {
  const data = JSON.parse(event.data);
  if (data.type === "stream_stopped") {
    console.log("Stream stopped:", data.error_message);
    pc.close();
  }
};
```

### Sending Parameters

```javascript
function sendParameters(params) {
  if (dataChannel.readyState === "open") {
    dataChannel.send(JSON.stringify(params));
  }
}

// Update prompt
sendParameters({
  prompts: [{ text: "A cat playing piano", weight: 1.0 }]
});

// Update multiple parameters
sendParameters({
  prompts: [{ text: "A sunset over the ocean", weight: 1.0 }],
  denoising_step_list: [800, 600, 400],
  noise_scale: 0.7
});
```

### Available Parameters

#### Prompts

```javascript
// Single prompt
sendParameters({
  prompts: [{ text: "A beautiful forest", weight: 1.0 }]
});

// Blended prompts (spatial blending within frame)
sendParameters({
  prompts: [
    { text: "A sunny day", weight: 0.7 },
    { text: "A rainy day", weight: 0.3 }
  ],
  prompt_interpolation_method: "linear" // or "slerp"
});
```

#### Prompt Transitions

```javascript
// Smoothly transition between prompts over multiple frames
sendParameters({
  transition: {
    target_prompts: [{ text: "A night sky with stars", weight: 1.0 }],
    num_steps: 8,  // Transition over 8 chunks
    temporal_interpolation_method: "linear"
  }
});
```

#### Denoising Steps

```javascript
// More steps = higher quality, slower
sendParameters({ denoising_step_list: [1000, 750, 500, 250] });

// Fewer steps = faster, lower quality
sendParameters({ denoising_step_list: [700, 400] });
```

#### Noise Control

```javascript
sendParameters({
  noise_scale: 0.8,      // 0.0-1.0, amount of noise
  noise_controller: true  // Auto-adjust based on motion
});
```

#### Cache Control

```javascript
// Enable automatic cache management
sendParameters({ manage_cache: true });

// Force cache reset (one-shot)
sendParameters({ reset_cache: true });
```

#### Playback Control

```javascript
// Pause generation
sendParameters({ paused: true });

// Resume generation
sendParameters({ paused: false });
```

#### LoRA Scale Updates

Requires `lora_merge_mode: "runtime_peft"` at load time:

```javascript
sendParameters({
  lora_scales: [
    { path: "/path/to/style.safetensors", scale: 0.5 },
    { path: "/path/to/character.safetensors", scale: 1.2 }
  ]
});
```

#### VACE Parameters

```javascript
sendParameters({
  vace_ref_images: ["/path/to/reference.png"],
  vace_context_scale: 1.0  // 0.0-2.0
});
```

#### Spout (Windows Only)

```javascript
// Enable Spout output
sendParameters({
  spout_sender: { enabled: true, name: "ScopeOutput" }
});

// Receive from Spout
sendParameters({
  spout_receiver: { enabled: true, name: "ExternalApp" }
});
```

### Parameter Reference Table

| Parameter | Type | Range | Description |
|-----------|------|-------|-------------|
| `prompts` | array | - | Array of { text, weight } |
| `prompt_interpolation_method` | string | "linear", "slerp" | Blending method |
| `transition.target_prompts` | array | - | Target prompts to transition to |
| `transition.num_steps` | int | 0+ | Frames to transition over |
| `denoising_step_list` | array | descending | Timesteps (e.g., [1000, 750, 500]) |
| `noise_scale` | float | 0.0-1.0 | Manual noise amount |
| `noise_controller` | bool | - | Enable automatic noise adjustment |
| `manage_cache` | bool | - | Auto cache management |
| `reset_cache` | bool | - | Force cache reset (one-shot) |
| `paused` | bool | - | Pause/resume generation |
| `lora_scales` | array | - | Runtime LoRA scale updates |
| `vace_ref_images` | array | - | Reference image paths |
| `vace_context_scale` | float | 0.0-2.0 | Visual conditioning strength |

---

## Authentication

The API does not require authentication by default for local usage.

### TURN Server Credentials

For WebRTC connections that need to traverse firewalls (NAT traversal), TURN servers are used. The server automatically configures TURN credentials when environment variables are set:

**Using Cloudflare (via HuggingFace):**
```bash
export HF_TOKEN=your_huggingface_token
```

If no TURN credentials are configured, the server falls back to Google's public STUN server, which works for direct connections but may not work behind strict firewalls.

---

## VACE (Video All-In-One Creation and Editing)

> **Official Docs**: [docs/api/vace.md](https://github.com/daydreamlive/scope/blob/main/docs/api/vace.md) · [docs/vace.md](https://github.com/daydreamlive/scope/blob/main/docs/vace.md)

VACE enables guiding generation using reference images and control videos.

### Capabilities

| Feature | Description |
|---------|-------------|
| **Reference-to-Video (R2V)** | Use reference images to guide generation style/character |
| **Video-to-Video (VACE V2V)** | Use control videos (depth, pose, scribble) to guide generation |
| **Animate Anything** | Combine R2V + VACE V2V for character + motion control |

### Pipeline Compatibility

VACE is supported on Wan2.1 1.3B pipelines:
- `longlive` (recommended)
- `reward-forcing`
- `memflow`
- `streamdiffusionv2` (experimental, lower quality)

### Uploading Reference Images

```javascript
async function uploadReferenceImage(file) {
  const arrayBuffer = await file.arrayBuffer();
  const filename = encodeURIComponent(file.name);

  const response = await fetch(
    `http://localhost:8000/api/v1/assets?filename=${filename}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/octet-stream" },
      body: arrayBuffer
    }
  );

  if (!response.ok) {
    throw new Error(`Upload failed: ${response.statusText}`);
  }

  return await response.json();
  // Returns: { path: "/path/to/assets/image.png", ... }
}
```

### Setting Reference Images

**Via Initial Parameters (when starting WebRTC):**
```javascript
const response = await fetch("http://localhost:8000/api/v1/webrtc/offer", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({
    sdp: offer.sdp,
    type: offer.type,
    initialParameters: {
      prompts: [{ text: "A person walking in a forest", weight: 1.0 }],
      vace_ref_images: ["/path/to/reference.png"],
      vace_context_scale: 1.0
    }
  })
});
```

**Via Data Channel (during streaming):**
```javascript
// Set new reference image
dataChannel.send(JSON.stringify({
  vace_ref_images: ["/path/to/new_reference.png"],
  vace_context_scale: 1.0
}));

// Multiple reference images
dataChannel.send(JSON.stringify({
  vace_ref_images: [
    "/path/to/style_ref.png",
    "/path/to/character_ref.png"
  ],
  vace_context_scale: 1.2
}));

// Clear reference images
dataChannel.send(JSON.stringify({
  vace_ref_images: []
}));
```

### Context Scale Reference

| Scale | Effect |
|-------|--------|
| 0.0 | No reference influence (pure text-to-video) |
| 0.5 | Subtle influence, more creative freedom |
| 1.0 | Balanced influence (default) |
| 1.5 | Strong influence, closer to reference |
| 2.0 | Maximum influence, may reduce diversity |

### Listing Available Assets

```javascript
async function listAssets(type = "image") {
  const response = await fetch(`http://localhost:8000/api/v1/assets?type=${type}`);
  return await response.json();
}

const { assets } = await listAssets("image");
// [{ name: "ref1", path: "/path/to/ref1.png", ... }, ...]
```

---

## LoRA Configuration

> **Official Docs**: [docs/lora.md](https://github.com/daydreamlive/scope/blob/main/docs/lora.md)

### Compatibility

| Pipeline | LoRA Compatibility |
|----------|-------------------|
| `longlive` | Wan2.1-T2V-1.3B |
| `streamdiffusionv2` | Wan2.1-T2V-1.3B |
| `reward-forcing` | Wan2.1-T2V-1.3B |
| `memflow` | Wan2.1-T2V-1.3B |
| `krea-realtime-video` | Wan2.1-T2V-14B |

### Storage Location

LoRA files should be placed in: `~/.daydream-scope/models/lora/`

### Loading LoRAs at Pipeline Load

```javascript
await loadPipeline("longlive", {
  loras: [
    { path: "/path/to/style.safetensors", scale: 0.8 },
    { path: "/path/to/character.safetensors", scale: 1.0 }
  ],
  // permanent_merge: Maximum FPS, no runtime updates
  // runtime_peft: Allows runtime scale updates, lower FPS
  lora_merge_mode: "runtime_peft"
});
```

### Downloading LoRAs

**From HuggingFace:**
```bash
cd ~/.daydream-scope/models/lora
wget -O pixar.safetensors https://huggingface.co/Remade-AI/Pixar/resolve/main/pixar_10_epochs.safetensors?download=true
```

**From CivitAI (requires API key):**
```bash
cd ~/.daydream-scope/models/lora
wget -O arcane-jinx.safetensors "https://civitai.com/api/download/models/1679582?type=Model&format=SafeTensor&token=<YOUR_API_KEY>"
```

---

## Spout Integration (Windows Only)

> **Official Docs**: [docs/spout.md](https://github.com/daydreamlive/scope/blob/main/docs/spout.md)

Spout enables near-zero latency video sharing with local applications on Windows.

> **Note**: Spout is not available on RunPod (Linux) or macOS.

### Spout Sender

Send video to other applications:
```javascript
sendParameters({
  spout_sender: { enabled: true, name: "ScopeOutput" }
});
```

### Spout Receiver

Receive video from other applications:
```javascript
sendParameters({
  spout_receiver: { enabled: true, name: "ExternalApp" }
});
```

### Compatible Applications

- TouchDesigner (Syphon Spout In/Out TOPs)
- Unity (KlakSpout plugin)
- Blender (TextureSharing add-on)

---

## Related Documentation

- `scope-platform-reference.md` - Platform overview and deployment
- `workflows-reference.md` - WebRTC, VACE, LoRA, Spout workflows
- `scope-technical.md` - Project-specific technical decisions
