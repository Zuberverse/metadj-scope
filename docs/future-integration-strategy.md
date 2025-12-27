# Future Integration Strategy

**Last Modified**: 2025-12-27 19:00 EST
**Status**: Strategic Reference (Post-Hackathon Consideration)

## Purpose

Captures strategic insights about Scope's architecture, integration possibilities, and future opportunities for MetaDJ. This document preserves detailed findings from platform research for post-hackathon planning.

---

## How Daydream Positions Scope

### The Dual Identity

Scope is positioned as an **"enabling platform"** - not just an app with a UI, but infrastructure for real-time AI video generation that other tools can plug into.

| Layer | Purpose | Target User |
|-------|---------|-------------|
| **Native UI** | Experimentation, prototyping, quick demos | Creators exploring AI video |
| **APIs + Integrations** | Production workflows, custom apps | Developers, VJs, installation artists |

### Pitch Hierarchy

1. **Primary**: "Interactive tool with UI" - use the native timeline editor, prompts, controls
2. **Secondary**: "API to programmatically control Scope" - for power users/developers
3. **Tertiary**: Spout integration - for Windows pipeline workflows

**Key Quote from README:**
> "Use the API to programatically control Scope."

This appears in the "After your first generation you can:" section - positioned as an **advanced use case**, not the primary pitch.

### What This Means

- The native UI is **not just a playground** - it's the main product with real features
- Daydream doesn't pitch Scope as "infrastructure for your apps"
- They pitch it as "a tool you can also control programmatically"
- Building a custom UI is *possible* but beyond their primary vision

---

## Architecture: The Stack Explained

### Layer Diagram

```
┌─────────────────────────────────────────────────────────────┐
│  YOUR BROWSER / CUSTOM APP                                  │
│  (Connects via WebRTC / HTTP)                               │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│  SCOPE API  (what you talk to)                              │
│  - /api/v1/pipeline/load                                    │
│  - /api/v1/webrtc/offer                                     │
│  - WebRTC data channel for real-time params                 │
│  - Scope-specific features (VACE, Spout, assets)            │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│  SCOPE APPLICATION  (the wrapper)                           │
│  - Pipeline management                                      │
│  - WebRTC streaming server                                  │
│  - UI (the web interface)                                   │
│  - Asset management                                         │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│  UNDERLYING MODELS  (the AI engines)                        │
│  ├── StreamDiffusion V2                                     │
│  ├── LongLive (Wan-based)                                   │
│  ├── Krea Realtime (Wan2.1-T2V-14B)                        │
│  └── Reward Forcing                                         │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│  RUNPOD  (just the hardware)                                │
│  - GPU (RTX 5090)                                           │
│  - Container runtime                                        │
│  - Network proxy                                            │
└─────────────────────────────────────────────────────────────┘
```

### Key Distinctions

| Layer | What It Is | Has API? |
|-------|-----------|----------|
| **RunPod** | Cloud GPU hosting | Yes, for pod management (not video) |
| **StreamDiffusion** | Python library for real-time diffusion | Python API, but Scope wraps it |
| **Scope** | Application that bundles models + UI + streaming | **This is what you talk to** |

### Critical Clarifications

| Question | Answer |
|----------|--------|
| Is Scope API = StreamDiffusion API? | **No** - Scope wraps StreamDiffusion (and other models) |
| Is Scope API = RunPod API? | **No** - RunPod just hosts the container |
| What API are you using? | **Scope's API** - their custom REST + WebRTC server |
| Could you run this locally? | **Yes** - same API, just `localhost:8000` instead of RunPod URL |

### URL Anatomy

```
https://hrn42pv7b74jg7-8000.proxy.runpod.net/api/v1/pipeline/load
        │                    │                    │
        │                    │                    └── Scope API endpoint
        │                    └── Port 8000 (Scope server)
        └── RunPod proxy URL (just routing)
```

**RunPod's job**: Route your request to port 8000 on the container
**Scope's job**: Handle the `/api/v1/pipeline/load` request, load the model, etc.

---

## What the API Actually Is

### The Core Concept

The API is **remote control** - not extension or plugin development.

| You Send | Scope Does | You Receive |
|----------|-----------|-------------|
| "Load pipeline longlive" | Loads the AI model | "OK, loaded" |
| "Start WebRTC stream" | Begins generating | Video frames via WebRTC |
| "Change prompt to X" | Updates generation | Video changes |
| "Upload reference image" | Stores for VACE | "OK, stored" |

### Two Ways to Use Scope

**Option 1: Use the Scope UI (Playground)**
```
You → Open Browser → Go to Scope URL → Use their UI
```
This is what the hackathon uses.

**Option 2: Build Your Own UI (API)**
```
You → Build your own webpage/app → Your code talks to Scope API
```
Same backend, same AI, just different frontend.

### What You're NOT Doing With the API

| Misconception | Reality |
|--------------|---------|
| "Adding to RunPod" | No - RunPod just hosts it |
| "Extending Scope" | No - you're just controlling it |
| "Building a plugin" | No - you're building a separate app that talks to Scope |
| "Modifying the pipeline" | No - you pick which pipeline, you don't create new ones |

### Why Use the API?

| Reason | Example |
|--------|---------|
| Custom branding | MetaDJ-branded interface instead of "Scope" |
| Simplified controls | Only show the controls your users need |
| Integration | Embed in a larger app (streaming software, DJ tool) |
| Automation | Script prompt changes based on music/events |

---

## The Custom App Opportunity

### Architecture for a MetaDJ App

```
┌─────────────────────────────────────────────────────────────┐
│  YOUR USERS                                                 │
│  (anywhere in the world)                                    │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│  YOUR APP  (MetaDJ Scope / whatever you build)              │
│  - Your branding                                            │
│  - Your UX                                                  │
│  - Hosted anywhere (Vercel, etc.)                          │
└─────────────────────────────────────────────────────────────┘
                              │
                              │  API calls + WebRTC
                              ▼
┌─────────────────────────────────────────────────────────────┐
│  YOUR RUNPOD GPU  ($0.95/hr)                                │
│  └── Scope Server                                           │
│       └── AI Models                                         │
└─────────────────────────────────────────────────────────────┘
```

**You're renting the GPU. You control who connects. You build the interface.**

### What This Enables

| Component | Where | Cost |
|-----------|-------|------|
| Frontend app | Vercel/Netlify/wherever | ~Free |
| Scope backend | Your RunPod instance | $0.95/hr while running |
| Users | Connect through your app | They don't know about RunPod |

### Challenges to Solve

#### 1. Authentication (Scope has none by default)
Right now, anyone with your RunPod URL can use your GPU.

**Solutions:**
- Proxy through your own backend with auth
- Add API keys at the proxy layer
- Accept the risk for demos

#### 2. Cost Model
- GPU runs = you pay ($0.95/hr = ~$684/month if 24/7)
- Users use it = you pay more (compute time)

**Options:**
- Charge users
- Limit usage
- Eat the cost for demos
- Start/stop pod on-demand

#### 3. Scaling
- One RunPod = one Scope instance = limited concurrent users
- More users = need multiple pods or queuing

#### 4. Uptime
- Pod stopped = app doesn't work
- Need to manage start/stop or pay for always-on

### Tiers of Implementation

**A. Personal Tool** (current hackathon approach)
- Just you using it
- Start/stop pod manually
- Cost: ~$20-50/month for occasional use

**B. Demo/Portfolio Piece**
- Spin up for demos
- Show what's possible
- Cost: pay per demo session

**C. Actual Product** (bigger lift)
- Auth system
- Usage tracking
- Payment integration
- Multi-user support
- Cost: significant infrastructure work

### Simplest Implementation Path

```
Your Next.js App (metadj-scope)
         │
         ├── Environment variable: SCOPE_API_URL
         │   (points to your RunPod instance)
         │
         ├── Your UI components
         │   (prompt input, video player, controls)
         │
         └── API client
             (talks to Scope via WebRTC)
```

The `metadj-scope` scaffold already exists. Would need to:
1. Connect to RunPod URL via environment variable
2. Implement WebRTC client (see `api-reference.md` for code examples)
3. Build UI components for controls
4. Display the video stream

---

## TouchDesigner + Scope Integration

### The Value Proposition

```
┌─────────────────────────────────────────────────────────────┐
│                    SCOPE                                    │
│    "AI Video Generation Engine"                             │
│    - Text-to-video / Image-to-video                        │
│    - Real-time (8-15 FPS)                                   │
│    - Identity consistency (VACE)                            │
│    - Style control (LoRA)                                   │
└─────────────────────────────────────────────────────────────┘
                              │
                              │ Spout (near-zero latency)
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                    TOUCHDESIGNER                            │
│    "Creative Control Layer"                                 │
│    - Compositing & layering                                 │
│    - Effects & post-processing                              │
│    - Audio reactivity                                       │
│    - Projection mapping                                     │
│    - Interactive triggers (OSC, MIDI, sensors)             │
│    - Multi-output routing                                   │
└─────────────────────────────────────────────────────────────┘
```

### Critical Constraint

**Spout requires Windows** - not available on RunPod (Linux).

| Integration Path | Platform | Latency | Notes |
|------------------|----------|---------|-------|
| Spout | Windows only | Near-zero | GPU memory sharing |
| NDI | Cross-platform | Low (LAN) | Network video protocol |
| WebRTC | Cross-platform | Variable | Browser-based |

### Workflow Examples

**1. Live Performance Visual Layer**
```
Webcam → Scope (avatar generation) → TouchDesigner → Projection/LED Wall
                                           │
                                           ├── Add particle effects
                                           ├── Audio-reactive overlays
                                           ├── Brand graphics compositing
                                           └── Multi-screen output
```

**2. Interactive Installation**
```
TouchDesigner (sensors/OSC) → Scope (dynamic prompts) → TouchDesigner → Display
         │                                                       │
         └── Visitor proximity changes prompt                    └── Add environment graphics
```

**3. DJ/VJ Performance**
```
DJ Software (audio) → TouchDesigner (audio analysis) → Scope (prompt modulation) → TouchDesigner → Output
                              │                                                          │
                              └── Beat detection changes style                          └── Mix with prepared visuals
```

### Capability Comparison

| Capability | Native Scope UI | With TouchDesigner |
|------------|-----------------|-------------------|
| Text-to-video generation | Yes | Yes |
| Webcam transformation | Yes | Yes |
| VACE identity consistency | Yes | Yes |
| LoRA style customization | Yes | Yes |
| Compositing with other sources | No | Yes |
| Audio reactivity | No | Yes |
| Multi-output routing | No | Yes |
| Complex effects chains | No | Yes |
| Projection mapping | No | Yes |
| Interactive triggers | No | Yes |

### Architecture Options

**Option A: RunPod + Browser (Current Hackathon)**
```
RunPod (Linux)
└── Scope Server
    └── WebRTC Output
        └── Browser (any platform)
```

**Option B: Local Windows + TouchDesigner (Future)**
```
Windows Machine
├── Scope (local install)
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

---

## Decision Matrix

### When to Use What

| Use Case | Best Approach |
|----------|---------------|
| Quick experiments | Native Scope UI |
| Simple demos | Native Scope UI |
| Solo streaming to browser | Native Scope UI |
| Custom branded experience | Custom app via API |
| Production live performance | Local Windows + TouchDesigner |
| Interactive installation | Local Windows + TouchDesigner |
| Multi-source compositing | TouchDesigner integration |
| Audio-reactive visuals | TouchDesigner integration |

### Platform Selection

| Scenario | Platform |
|----------|----------|
| Hackathon demo | RunPod + Browser |
| Personal use | RunPod + Browser (start/stop manually) |
| Portfolio demo | RunPod + Custom app |
| Live performance | Local Windows + Scope + TouchDesigner |
| Production product | Needs full architecture planning |

---

## Cost Considerations

### RunPod GPU Costs

| Usage Pattern | Monthly Cost (RTX 5090 @ $0.95/hr) |
|---------------|-----------------------------------|
| 2 hrs/day | ~$57/month |
| 4 hrs/day | ~$114/month |
| 8 hrs/day | ~$228/month |
| 24/7 | ~$684/month |

### Local Windows Alternative

| Component | One-Time Cost |
|-----------|---------------|
| RTX 4090 GPU | ~$1,600 |
| Compatible system | ~$1,000-2,000 |
| TouchDesigner license | Free (non-commercial) or $600+ (commercial) |

**Break-even**: ~4-5 months of moderate RunPod usage

---

## Future Exploration Areas

### Short-Term (Post-Hackathon)
- [ ] Test custom app connecting to RunPod Scope instance
- [ ] Explore authentication options for Scope API
- [ ] Evaluate local Windows + Scope + TouchDesigner setup

### Medium-Term
- [ ] Build MetaDJ-branded control interface
- [ ] Implement audio-reactive prompt modulation
- [ ] Explore NDI for remote TouchDesigner workflows

### Long-Term
- [ ] Multi-user architecture planning
- [ ] Cost model for potential product
- [ ] Integration with MetaDJ Studio / MetaDJ Nexus ecosystem

---

## Related Documentation

- `touchdesigner-reference.md` - TouchDesigner operators and Spout integration
- `api-reference.md` - Complete Scope API documentation with code examples
- `workflows-reference.md` - WebRTC, VACE, LoRA, Spout workflows
- `runpod-reference.md` - RunPod platform reference
- `scope-platform-reference.md` - Scope platform overview
