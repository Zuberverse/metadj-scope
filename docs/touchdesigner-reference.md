# TouchDesigner Reference

**Last Modified**: 2025-12-27 18:00 EST
**Source**: TouchDesigner Documentation (docs.derivative.ca)
**Status**: Canonical Reference

## Purpose

Complete TouchDesigner documentation for the MetaDJ Scope hackathon project. Covers platform fundamentals, operator families, Spout integration with Scope, AI/ML workflows, and video routing options.

---

## Quick Start

### What is TouchDesigner?

TouchDesigner is a visual development platform for creating real-time interactive multimedia content. It uses a node-based workflow where **operators** (nodes) are connected to create complex visual systems.

**Key Characteristics:**
- Real-time performance (optimized for live visuals)
- Node-based visual programming
- GPU-accelerated processing
- Extensive video/audio I/O support
- Python scripting integration

**Current Version**: 2025.32050 (TouchDesigner 2025)

### Installation

- Download from [derivative.ca](https://derivative.ca/download)
- **Free Non-Commercial License** available (watermark on output)
- **Commercial Licenses** for professional use

---

## Core Concepts

### File Types

| Extension | Name | Description |
|-----------|------|-------------|
| `.toe` | TOE File | Main project file containing all networks and data |
| `.tox` | TOX File | Reusable component file (can be loaded into any project) |

### Modes

| Mode | Description |
|------|-------------|
| **Designer Mode** | Full editing environment with UI |
| **Perform Mode** | Minimal UI for live performance (press Escape to toggle) |

### Cooking (Processing)

TouchDesigner uses a **procedural cooking model**:
- Operators automatically reprocess when inputs change
- Data flows through the network reactively
- Only dirty (changed) branches recalculate

### Timelines

| Type | Description |
|------|-------------|
| **Frames** | Global animation timeline (default 1-600) |
| **Seconds** | Absolute time reference |
| **Timecode** | SMPTE timecode synchronization |

---

## Operator Families

TouchDesigner organizes operators into families based on data type:

### TOPs (Texture Operators)

**Data Type**: 2D images and video
**Color Code**: Purple

**Common TOPs:**
| Operator | Description |
|----------|-------------|
| Movie File In | Load video files |
| Video Device In | Capture from webcam/capture cards |
| Syphon Spout In | Receive from Spout/Syphon |
| Syphon Spout Out | Send to Spout/Syphon |
| Composite | Blend multiple images |
| Transform | Scale, rotate, translate images |
| Blur | Apply blur effects |
| Level | Adjust brightness, contrast, gamma |
| Feedback | Create recursive visual effects |
| Script | Custom Python/NumPy image processing |
| NVIDIA Background | AI-powered person segmentation |

**TOP Count**: 151 operators available

### CHOPs (Channel Operators)

**Data Type**: Motion data, audio, control signals
**Color Code**: Green

**Common CHOPs:**
| Operator | Description |
|----------|-------------|
| Audio Device In | Capture audio input |
| LFO | Generate oscillating values |
| Noise | Generate random values |
| Math | Arithmetic operations |
| Filter | Smooth data over time |
| Constant | Static values |
| Trail | Record value history |

### SOPs (Surface Operators)

**Data Type**: 3D geometry
**Color Code**: Blue

**Common SOPs:**
| Operator | Description |
|----------|-------------|
| Sphere | Create sphere geometry |
| Box | Create box geometry |
| Grid | Create grid mesh |
| Line | Create line geometry |
| Transform | Transform geometry |
| Merge | Combine geometries |

### DATs (Data Operators)

**Data Type**: Text, tables, scripts
**Color Code**: Teal

**Common DATs:**
| Operator | Description |
|----------|-------------|
| Text | Store text data |
| Table | Store tabular data |
| Execute | Python execute callbacks |
| Web Client | HTTP requests |
| OSC In | Receive OSC messages |
| MIDI In | Receive MIDI data |

### MATs (Material Operators)

**Data Type**: Materials and shaders
**Color Code**: Orange

**Common MATs:**
| Operator | Description |
|----------|-------------|
| Phong | Classic shading material |
| PBR | Physically-based rendering |
| Constant | Flat color material |
| GLSL | Custom shader material |

### COMPs (Component Operators)

**Data Type**: 3D objects, UI elements, containers
**Color Code**: Gray

**Common COMPs:**
| Operator | Description |
|----------|-------------|
| Geometry | 3D object container |
| Camera | Viewpoint |
| Light | Light source |
| Container | Network container |
| Base | Reusable component base |
| Window | Output window |

### POPs (Point Operators)

**Data Type**: GPU point processing
**Color Code**: Magenta

**Purpose**: High-performance particle systems using GPU compute

---

## Spout Integration

### What is Spout?

Spout is a **real-time GPU texture sharing framework** for Windows. It enables near-zero latency video routing between applications using shared GPU memory.

**Key Facts:**
- **Platform**: Windows only (macOS uses Syphon)
- **Latency**: Near-zero (GPU memory sharing)
- **GPU Requirement**: NVIDIA or AMD (Intel GPUs not supported)
- **Default Limit**: 10 Spout senders per computer (configurable via registry)

### Syphon Spout In TOP

Receives textures from Spout (Windows) or Syphon (macOS) sources.

**Parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| Sender Name | String | Name of Spout sender to receive from (empty = any) |
| Use Spout Active Sender | Toggle | Use system's active sender (Windows only) |

**Outputs:**
- `w` - Width of received texture
- `h` - Height of received texture

### Syphon Spout Out TOP

Sends textures to other Spout/Syphon-compatible applications.

**Parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| Active | Toggle | Enable/disable sending |
| Sender Name | String | Name to identify this output (any text) |

**Supported Formats:**
- 8-bit fixed (RGBA)
- 16-bit fixed (RGBA)
- 16-bit float (RGBA)
- 32-bit float (RGBA)

### Compatible Applications

| Application | Notes |
|-------------|-------|
| Resolume Arena/Avenue | VJ software |
| Max/MSP | Visual programming |
| Processing | Creative coding |
| MadMapper | Projection mapping |
| TouchDesigner | This platform |
| Unity (KlakSpout) | Game engine |
| Blender (TextureSharing) | 3D software |
| OBS (Spout2 plugin) | Streaming software |
| **Daydream Scope** | AI video generation |

---

## Scope Integration

### Architecture Overview

```
┌─────────────────────────────────────────────────────────────┐
│                    Windows Machine                          │
│                                                             │
│  ┌─────────────┐    Spout    ┌─────────────────────────┐   │
│  │             │ ──────────► │                         │   │
│  │ TouchDesigner│            │    Daydream Scope       │   │
│  │             │ ◄────────── │    (Local Windows)      │   │
│  └─────────────┘    Spout    └─────────────────────────┘   │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

**Critical Limitation**: Spout requires Scope running on **Windows**. Spout is **not available** on RunPod (Linux).

### Scope Spout Configuration

**Scope as Receiver** (input from TouchDesigner):
1. Set "Input Mode" to "Video"
2. Select "Spout Receiver" as "Video Source"
3. Set "Sender Name" to match TouchDesigner's output name

**Scope as Sender** (output to TouchDesigner):
1. Enable "Spout Sender" in Settings
2. Default name: "ScopeOut" (customizable)

### TouchDesigner Setup

**Receive from Scope:**
```
Syphon Spout In TOP
├── Sender Name: "ScopeOut"
└── [Output connects to your processing chain]
```

**Send to Scope:**
```
[Your video source]
└── Syphon Spout Out TOP
    └── Sender Name: "TouchDesignerOut"

Then in Scope, set Video Source > Sender Name to "TouchDesignerOut"
```

### Example Workflow: TouchDesigner + Scope

1. **Start Scope** on Windows with Spout Sender enabled ("ScopeOut")
2. **In TouchDesigner**, create network:
   ```
   Syphon Spout In (name: ScopeOut)
   └── Composite TOP
       ├── [Scope AI output]
       └── [Your overlay graphics]
           └── Syphon Spout Out (name: ProcessedOutput)
               └── Window COMP [live output]
   ```
3. **Process** the AI-generated video with TouchDesigner effects
4. **Output** to screens, projectors, or back to another application

---

## AI/ML Integration

TouchDesigner offers several paths for AI/ML integration:

### Script TOP (Custom Python/NumPy)

Process images with custom Python code using NumPy arrays.

**Key Method:**
```python
def onCook(scriptOP):
    # Get input as NumPy array
    input_array = scriptOP.inputs[0].numpyArray()

    # Process with NumPy, OpenCV, or ML model
    result = my_ml_function(input_array)

    # Copy result back
    scriptOP.copyNumpyArray(result)
```

**Use Cases:**
- Custom image filters
- OpenCV processing
- TensorFlow/PyTorch inference
- MediaPipe integration

**Considerations:**
- CPU-based (not GPU accelerated)
- Latency depends on processing complexity
- Good for prototyping ML workflows

### NVIDIA Background TOP

AI-powered image segmentation using NVIDIA Maxine Video Effects SDK.

**Capabilities:**
- Person/background separation
- Real-time mask output
- Quality vs Performance mode

**Requirements:**
- NVIDIA RTX 20/30/40/50 series GPU
- Minimum input resolution: 512x288 pixels
- Windows only

**Parameters:**

| Parameter | Options | Description |
|-----------|---------|-------------|
| Mode | Quality / Performance | Trade-off between accuracy and speed |
| Output | Image / Mask / Both | What to output |

**Use Case for MetaDJ:**
Could segment the DJ/performer from background for overlay compositing.

### External ML Services

For more complex ML workflows, route video to external services:

| Approach | Method | Latency |
|----------|--------|---------|
| Spout to Scope | Local GPU sharing | ~Zero |
| NDI to Remote | Network video | Medium |
| WebRTC API | HTTP/WebSocket | Variable |

---

## Video Routing Options

### Spout (Local, Windows)

**Best For**: Same-machine, low-latency sharing

| Attribute | Value |
|-----------|-------|
| Platform | Windows only |
| Latency | Near-zero (GPU memory) |
| Quality | Lossless |
| Network | Local only |
| Setup | Simple |

### Syphon (Local, macOS)

**Best For**: Same-machine sharing on Mac

| Attribute | Value |
|-----------|-------|
| Platform | macOS only |
| Latency | Near-zero (GPU memory) |
| Quality | Lossless |
| Network | Local only |
| Setup | Simple |

### NDI (Network)

**Best For**: Cross-machine video over LAN

| Attribute | Value |
|-----------|-------|
| Platform | Cross-platform |
| Latency | Low (LAN dependent) |
| Quality | High (SpeedHQ codec) |
| Network | LAN required |
| Discovery | Automatic (mDNS) |

**TouchDesigner Operators:**
- `NDI In TOP` - Receive NDI streams
- `NDI Out TOP` - Send NDI streams

### Touch In/Out (Network)

**Best For**: TouchDesigner-to-TouchDesigner over network

| Attribute | Value |
|-----------|-------|
| Platform | TouchDesigner only |
| Codec | HAP (GPU-accelerated) |
| Network | LAN required |
| Setup | Moderate |

### Decision Matrix

| Scenario | Recommended |
|----------|-------------|
| Same Windows machine, low latency | **Spout** |
| Same macOS machine, low latency | **Syphon** |
| Different machines on LAN | **NDI** |
| TD to TD on network | **Touch In/Out** |
| Cloud GPU to local | **WebRTC/WHIP** |

---

## MetaDJ Scope Context

### Hackathon Constraint

The MetaDJ Scope hackathon uses **RunPod (Linux)**, which means:
- **Spout is NOT available** on the RunPod instance
- TouchDesigner integration requires a **separate Windows machine**
- Alternative: Use WebRTC for browser-based viewing

### Potential Architectures

**Option A: RunPod + Browser (Current)**
```
RunPod (Linux)
└── Scope Server
    └── WebRTC Output
        └── Browser (any platform)
```

**Option B: Local Windows + TouchDesigner (Future)**
```
Windows Machine
├── Scope (local)
│   ├── Spout Out: "ScopeOut"
│   └── Spout In: "TouchDesignerIn"
└── TouchDesigner
    ├── Syphon Spout In: "ScopeOut"
    ├── [Processing/Compositing]
    └── Syphon Spout Out: "TouchDesignerIn"
```

**Option C: Hybrid (Post-Hackathon)**
```
RunPod (Linux)                Windows Machine
└── Scope Server              └── TouchDesigner
    └── WebRTC ──────────────────► WebRTC Receiver
                                   └── Processing
                                       └── Output
```

### Future Integration Ideas

1. **AI Avatar Compositing**: Use Scope for avatar generation, TouchDesigner for overlays/environments
2. **Live Performance Pipeline**: Webcam → Scope → TouchDesigner → Projection
3. **Interactive Installations**: TouchDesigner controls + Scope AI generation

---

## Resources

### Official Documentation
- **TouchDesigner Wiki**: https://docs.derivative.ca
- **TouchDesigner Forum**: https://forum.derivative.ca
- **Derivative (Company)**: https://derivative.ca

### Spout
- **Spout Website**: https://spout.zeal.co
- **Spout GitHub**: https://github.com/leadedge/Spout2

### Scope Integration
- **Scope Spout Docs**: https://github.com/daydreamlive/scope/blob/main/docs/spout.md
- **Local Reference**: `workflows-reference.md` (Spout section)

### Learning Resources
- **TouchDesigner Tutorials**: https://derivative.ca/tutorials
- **Elburz Sorkhabi Tutorials**: YouTube/Patreon
- **Matthew Ragan**: Interactive & Immersive HQ

---

## Related Documentation

### Internal
- `scope-platform-reference.md` - Daydream Scope platform overview
- `workflows-reference.md` - WebRTC, VACE, LoRA, Spout workflows
- `api-reference.md` - Scope API endpoints and parameters
- `runpod-reference.md` - RunPod platform reference
- `research.md` - Project research and validation notes

### External
- **TouchDesigner**: https://docs.derivative.ca
- **Spout**: https://spout.zeal.co
- **Scope GitHub**: https://github.com/daydreamlive/scope
