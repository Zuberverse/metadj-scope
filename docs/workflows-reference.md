# Scope Workflows Reference

**Last Modified**: 2025-12-27 14:00 EST
**Source**: GitHub repository (github.com/daydreamlive/scope/docs)
**Status**: Canonical Reference

## Purpose

Complete workflow documentation for Daydream Scope, covering WebRTC streaming modes, VACE identity conditioning, LoRA adapters, and Spout integration.

---

## Table of Contents

1. [WebRTC: Text-to-Video (Receive Only)](#webrtc-text-to-video-receive-only)
2. [WebRTC: Video-to-Video (Send and Receive)](#webrtc-video-to-video-send-and-receive)
3. [VACE: Identity Conditioning](#vace-identity-conditioning)
4. [LoRA: Custom Adapters](#lora-custom-adapters)
5. [Spout: External Tool Integration](#spout-external-tool-integration)

---

## WebRTC: Text-to-Video (Receive Only)

Receive generated video from text prompts without sending input video.

### Overview

In receive-only mode:
- You send text prompts to control generation
- The server generates video and streams it back
- No input video required

### Prerequisites

- Server running: `uv run daydream-scope`
- Models downloaded for your pipeline
- Pipeline loaded (see Load Pipeline in `api-reference.md`)

### Complete Example

```javascript
async function startReceiveStream(initialPrompt = "A beautiful landscape") {
  const API_BASE = "http://localhost:8000";

  // 1. Get ICE servers from backend
  const iceResponse = await fetch(`${API_BASE}/api/v1/webrtc/ice-servers`);
  const { iceServers } = await iceResponse.json();

  // 2. Create peer connection
  const pc = new RTCPeerConnection({ iceServers });

  // State management
  let sessionId = null;
  const queuedCandidates = [];

  // 3. Create data channel for parameters
  const dataChannel = pc.createDataChannel("parameters", { ordered: true });
  dataChannel.onopen = () => {
    console.log("Data channel opened - ready for parameter updates");
  };
  dataChannel.onmessage = (event) => {
    const data = JSON.parse(event.data);
    if (data.type === "stream_stopped") {
      console.log("Stream stopped:", data.error_message);
      pc.close();
    }
  };

  // 4. Add video transceiver (receive-only, no input)
  pc.addTransceiver("video");

  // 5. Handle incoming video track
  pc.ontrack = (event) => {
    if (event.streams && event.streams[0]) {
      const videoElement = document.getElementById("video");
      videoElement.srcObject = event.streams[0];
    }
  };

  // 6. Connection state monitoring
  pc.onconnectionstatechange = () => {
    console.log("Connection state:", pc.connectionState);
  };

  // 7. Handle ICE candidates (Trickle ICE)
  pc.onicecandidate = async (event) => {
    if (event.candidate) {
      if (sessionId) {
        await sendIceCandidate(sessionId, event.candidate);
      } else {
        queuedCandidates.push(event.candidate);
      }
    }
  };

  // 8. Create and send offer
  const offer = await pc.createOffer();
  await pc.setLocalDescription(offer);

  const response = await fetch(`${API_BASE}/api/v1/webrtc/offer`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      sdp: pc.localDescription.sdp,
      type: pc.localDescription.type,
      initialParameters: {
        prompts: [{ text: initialPrompt, weight: 1.0 }],
        denoising_step_list: [1000, 750, 500, 250],
        manage_cache: true
      }
    })
  });

  const answer = await response.json();
  sessionId = answer.sessionId;

  // 9. Set remote description
  await pc.setRemoteDescription({ type: answer.type, sdp: answer.sdp });

  // 10. Send queued ICE candidates
  for (const candidate of queuedCandidates) {
    await sendIceCandidate(sessionId, candidate);
  }
  queuedCandidates.length = 0;

  return { pc, dataChannel, sessionId };
}

async function sendIceCandidate(sessionId, candidate) {
  await fetch(`http://localhost:8000/api/v1/webrtc/offer/${sessionId}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      candidates: [{
        candidate: candidate.candidate,
        sdpMid: candidate.sdpMid,
        sdpMLineIndex: candidate.sdpMLineIndex
      }]
    })
  });
}
```

### Key Differences from Video-to-Video

| Aspect | Text-to-Video | Video-to-Video |
|--------|--------------|----------------|
| **Video Input** | None | Webcam/Screen/File |
| **Transceiver** | `pc.addTransceiver("video")` | `pc.addTrack(track, stream)` |
| **Initial Params** | No `input_mode` | `input_mode: "video"` |
| **Use Case** | Prompt-only generation | Transform input video |

---

## WebRTC: Video-to-Video (Send and Receive)

Send input video (webcam, screen, file) and receive transformed video.

### Overview

In video-to-video mode:
- You send video frames as input (webcam, screen capture, file)
- The server transforms the video based on your prompts
- Generated video is streamed back in real-time

### Complete Example

```javascript
async function startBidirectionalStream(inputStream, initialPrompt = "A painting") {
  const API_BASE = "http://localhost:8000";

  // 1. Get ICE servers
  const iceResponse = await fetch(`${API_BASE}/api/v1/webrtc/ice-servers`);
  const { iceServers } = await iceResponse.json();

  // 2. Create peer connection
  const pc = new RTCPeerConnection({ iceServers });

  // State
  let sessionId = null;
  const queuedCandidates = [];

  // 3. Create data channel
  const dataChannel = pc.createDataChannel("parameters", { ordered: true });
  dataChannel.onopen = () => {
    console.log("Data channel ready");
  };
  dataChannel.onmessage = (event) => {
    const data = JSON.parse(event.data);
    if (data.type === "stream_stopped") {
      console.log("Stream stopped:", data.error_message);
      pc.close();
    }
  };

  // 4. Add LOCAL video track (for sending to server)
  inputStream.getTracks().forEach((track) => {
    if (track.kind === "video") {
      console.log("Adding video track for sending");
      pc.addTrack(track, inputStream);
    }
  });

  // 5. Handle REMOTE video track (from server)
  pc.ontrack = (event) => {
    if (event.streams && event.streams[0]) {
      document.getElementById("outputVideo").srcObject = event.streams[0];
    }
  };

  // 6. Connection monitoring
  pc.onconnectionstatechange = () => {
    console.log("Connection state:", pc.connectionState);
  };

  // 7. ICE candidate handling
  pc.onicecandidate = async (event) => {
    if (event.candidate) {
      if (sessionId) {
        await sendIceCandidate(sessionId, event.candidate);
      } else {
        queuedCandidates.push(event.candidate);
      }
    }
  };

  // 8. Create and send offer
  const offer = await pc.createOffer();
  await pc.setLocalDescription(offer);

  const response = await fetch(`${API_BASE}/api/v1/webrtc/offer`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      sdp: pc.localDescription.sdp,
      type: pc.localDescription.type,
      initialParameters: {
        input_mode: "video",  // Critical for video-to-video
        prompts: [{ text: initialPrompt, weight: 1.0 }],
        denoising_step_list: [700, 500]
      }
    })
  });

  const answer = await response.json();
  sessionId = answer.sessionId;

  // 9. Set remote description
  await pc.setRemoteDescription({ type: answer.type, sdp: answer.sdp });

  // 10. Flush queued candidates
  for (const candidate of queuedCandidates) {
    await sendIceCandidate(sessionId, candidate);
  }
  queuedCandidates.length = 0;

  return { pc, dataChannel, sessionId };
}
```

### Input Sources

```javascript
// Webcam
const stream = await navigator.mediaDevices.getUserMedia({ video: true });

// Screen capture
const stream = await navigator.mediaDevices.getDisplayMedia({ video: true });

// File/Canvas (using captureStream)
const canvas = document.getElementById("myCanvas");
const stream = canvas.captureStream(30);  // 30 FPS
```

### Performance Tips

**Match Resolution**: Set input resolution to match pipeline resolution for best quality:

```javascript
const stream = await navigator.mediaDevices.getUserMedia({
  video: { width: 512, height: 512 }  // If pipeline loaded with 512x512
});
```

**Frame Rate**: Lower frame rates reduce bandwidth and processing load:

```javascript
video: { frameRate: { ideal: 15, max: 20 } }
```

---

## VACE: Identity Conditioning

VACE (Video All-In-One Creation and Editing) enables guiding generation using reference images and control videos.

### Overview

VACE allows you to:
- Condition generation on reference images (style, character, scene)
- Use control videos to preserve structure and motion
- Control the influence strength of visual conditioning

### Pipeline Compatibility

| Pipeline | VACE Support |
|----------|--------------|
| **longlive** | **Yes** (Confirmed) |
| krea-realtime-video | **No** |
| streamdiffusionv2 | TBD |
| reward-forcing | TBD |

**Important**: VACE controls are hidden in the UI when using pipelines that don't support it.

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

  return await response.json();  // Returns: { path: "/path/to/assets/image.png", ... }
}
```

### Setting Reference Images

**Via Initial Parameters:**

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

### VACE Parameters

| Parameter | Type | Range | Default | Description |
|-----------|------|-------|---------|-------------|
| `vace_ref_images` | array | - | [] | List of reference image paths |
| `vace_context_scale` | float | 0.0-2.0 | 1.0 | Visual conditioning strength |

### Context Scale Guide

| Scale | Effect |
|-------|--------|
| 0.0 | No reference influence (pure text-to-video) |
| 0.5 | Subtle influence, more creative freedom |
| 1.0 | Balanced influence (default) |
| 1.5 | Strong influence, closer to reference |
| 2.0 | Maximum influence, may reduce diversity |

### Combining Control Video with Reference Images

You can use both control video and reference images together:

```javascript
// Send control video via WebRTC track (video-to-video mode)
// Then set reference images via data channel
dataChannel.send(JSON.stringify({
  vace_ref_images: ["/path/to/style_reference.png"],
  vace_context_scale: 1.0
}));
```

This allows you to:
- Use the **control video** for motion and structure
- Use **reference images** for style, character appearance, or scene elements

### Listing Available Assets

```javascript
async function listAssets(type = "image") {
  const response = await fetch(`http://localhost:8000/api/v1/assets?type=${type}`);
  return await response.json();
}

const { assets } = await listAssets("image");
// Returns: [{ name: "ref1", path: "/path/to/ref1.png", ... }, ...]
```

---

## LoRA: Custom Adapters

LoRA (Low-Rank Adaptation) adapters allow you to customize concepts and styles in generations.

### Pipeline Compatibility

| Pipeline | Compatible LoRAs |
|----------|-----------------|
| streamdiffusionv2 | Wan2.1-T2V-1.3B LoRAs |
| longlive | Wan2.1-T2V-1.3B LoRAs |
| reward-forcing | Wan2.1-T2V-1.3B LoRAs |
| krea-realtime-video | Wan2.1-T2V-14B LoRAs |

### Recommended LoRAs

**For streamdiffusionv2, longlive, reward-forcing (1.3B):**
- [Arcane Jinx](https://civitai.com/)
- [Genshin TCG](https://huggingface.co/)

**For krea-realtime-video (14B):**
- [Origami](https://huggingface.co/)
- [Film Noir](https://huggingface.co/)
- [Pixar](https://huggingface.co/Remade-AI/Pixar)

### Installing LoRAs

**Local Installation:**
1. Download the `.safetensors` file from HuggingFace or CivitAI
2. Move to `~/.daydream-scope/models/lora/`

**Cloud Installation (RunPod):**

From HuggingFace:
```bash
cd ~/.daydream-scope/models/lora
wget -O pixar_10_epochs.safetensors https://huggingface.co/Remade-AI/Pixar/resolve/main/pixar_10_epochs.safetensors?download=true
```

From CivitAI (requires API key):
```bash
cd ~/.daydream-scope/models/lora
wget -O arcane-jinx.safetensors "https://civitai.com/api/download/models/1679582?type=Model&format=SafeTensor&token=<YOUR_TOKEN>"
```

**Important**: Surround the CivitAI URL with double quotes!

### Loading LoRAs at Pipeline Start

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

### Runtime LoRA Scale Updates

Requires `lora_merge_mode: "runtime_peft"` at load time:

```javascript
dataChannel.send(JSON.stringify({
  lora_scales: [
    { path: "/path/to/style.safetensors", scale: 0.5 },
    { path: "/path/to/character.safetensors", scale: 1.2 }
  ]
}));
```

---

## Spout: External Tool Integration

Spout enables near-zero latency sharing of real-time video with other local applications on Windows.

### Requirements

**Important**: The Scope server must be running on a **Windows machine** to use Spout. Spout is not available on RunPod (Linux) machines.

### Spout Receiver (Input from Other Apps)

Configure Scope to receive video from another application:

1. Select "Video" for "Input Mode" under "Input & Controls"
2. Select "Spout Receiver" for "Video Source"
3. Set "Sender Name" to the specific name from the sending application (or leave empty for any)

**Via API:**
```javascript
dataChannel.send(JSON.stringify({
  spout_receiver: { enabled: true, name: "ExternalApp" }
}));
```

### Spout Sender (Output to Other Apps)

Configure Scope to send video to another application:

1. Toggle "Spout Sender" to ON under "Settings"
2. The default sender name is "ScopeOut" (customizable)

**Via API:**
```javascript
dataChannel.send(JSON.stringify({
  spout_sender: { enabled: true, name: "ScopeOut" }
}));
```

### Compatible Applications

Scope can share real-time video with any Spout-compatible application:

| Application | Plugin/Setup |
|-------------|--------------|
| **TouchDesigner** | Syphon Spout In / Syphon Spout Out TOPs |
| **Unity** | KlakSpout plugin |
| **Blender** | TextureSharing add-on |
| **OBS** | Spout2 source plugin |

### Example Workflow: TouchDesigner

1. Start Scope with Spout Sender enabled
2. In TouchDesigner, add a "Syphon Spout In" TOP
3. Set the sender name to "ScopeOut" (or your custom name)
4. TouchDesigner receives real-time AI-generated video
5. Process, composite, or output as needed

---

## Related Documentation

- `api-reference.md` - Complete API endpoint documentation
- `scope-platform-reference.md` - Platform overview and deployment
- `scope-technical.md` - Project-specific technical decisions
- `research.md` - Research findings and validation notes
