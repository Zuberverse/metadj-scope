# Soundscape Technical Mechanics

**Last Modified**: 2025-12-30 21:00 EST
**Status**: Active

## Purpose

Explain the core technical mechanics that make Soundscape work - how audio drives visuals, why transitions are seamless, and what parameters actually do under the hood.

---

## The Full Pipeline

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                           BROWSER (Client)                                   │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  [Audio Source] ──► [Meyda Analyzer] ──► [Mapping Engine] ──► [Param Sender]│
│   (file/mic)         ~86 Hz               30 Hz                 30 Hz       │
│                         │                    │                     │        │
│                         ▼                    ▼                     ▼        │
│                    Raw Features      Theme Mappings          WebRTC         │
│                    - RMS (energy)    - noiseScale            DataChannel    │
│                    - Spectral        - prompts                   │          │
│                    - Beats           - resetCache                │          │
│                                                                  │          │
└──────────────────────────────────────────────────────────────────┼──────────┘
                                                                   │
                                                                   ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                           SCOPE SERVER (GPU)                                 │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  [Parameters] ──► [Latent Cache] ──► [Noise Injection] ──► [Denoising]      │
│                        │                    │                   │            │
│                        ▼                    ▼                   ▼            │
│                  Previous frame      noise_scale         4-step schedule     │
│                  "memory"            controls change     [1000,750,500,250]  │
│                        │                    │                   │            │
│                        └────────────────────┴───────────────────┘            │
│                                         │                                    │
│                                         ▼                                    │
│                              [Generated Frame] ──► WebRTC Video Track        │
│                                   ~15-20 FPS (4-step on RTX 6000)            │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## Core Concepts

### Latent Space

Diffusion models don't work directly on pixels. They operate in **latent space** - a compressed mathematical representation.

```
Image (512×512 pixels) → Encoder → Latent (64×64×4 numbers) → Model → Decoder → Image
          ~786K values              ~16K values                        ~786K values
```

**Think of it as**: Pixels are the painting; latents are the DNA that describes the painting.

### Latent Cache (Why Transitions Are Seamless)

The `longlive` pipeline maintains a **latent cache** - the previous frame's latent representation.

```
Frame N latents: [0.5, 0.3, 0.8, ...]     ← "cosmic nebula" encoded
                        │
                 + noise injection (controlled by noise_scale)
                        │
                        ▼
Frame N+1 latents: [0.52, 0.31, 0.79, ...]  ← slightly evolved
                        │
                 + denoising toward prompt
                        │
                        ▼
Frame N+1 output: Similar but evolved image
```

**The cache creates continuity.** Each frame starts where the last one ended, then evolves. This is why visuals flow instead of jump.

### Parameters We Control

| Parameter | Type | Effect |
|-----------|------|--------|
| `prompts` | `[{text, weight}]` | What the model generates toward |
| `noise_scale` | `0.0 - 1.0` | How much change per frame |
| `manage_cache` | `boolean` | Keep latent cache (smooth) or not |
| `reset_cache` | `boolean` | Clear cache this frame (hard cut) |
| `denoising_step_list` | `number[]` | Quality/speed tradeoff |
| `paused` | `boolean` | Stop/start generation |

### noise_scale Explained

```
noise_scale = 0.0  →  No noise  →  Frozen image (no change)
noise_scale = 0.3  →  Low noise →  Subtle drift, stable
noise_scale = 0.6  →  Medium    →  Noticeable evolution
noise_scale = 0.9  →  High      →  Rapid change, more chaotic
noise_scale = 1.0  →  Maximum   →  Very unstable
```

**In Soundscape**: Audio energy (loudness) drives noise_scale. Loud = more change.

### manage_cache vs reset_cache

| Setting | Behavior | Use Case |
|---------|----------|----------|
| `manage_cache: true` | Preserve latent cache between frames | Normal operation (smooth) |
| `reset_cache: true` | Clear cache this frame only | Beat drop effect (dramatic jump) |

**All themes now use `pulse_noise`** on beats - this boosts energy while preserving visual continuity (no dramatic jumps).

---

## Why Forward Motion Happens

**This is emergent model behavior, not something we control.**

The `longlive` pipeline exhibits forward-zooming motion because:

1. **Training Data Bias**: Most video content has forward motion (driving, walking, flying)
2. **Prompt Language**: Words like "journey", "voyage", "transformation" imply movement
3. **Noise + Cache**: The noise injection "pushes" latents, cache keeps continuity → apparent motion

**We have no explicit camera control.** The model's learned prior says "video = forward motion".

To reduce motion:
- Use lower `noise_scale` (less change per frame)
- Add "static scene, no movement" to prompts (may not work)
- Use `reset_cache` frequently (breaks continuity)

---

## Frame Rates

### What We Send (Parameter Updates)

| Component | Rate | Notes |
|-----------|------|-------|
| Meyda audio analysis | ~86 Hz | Buffer 512 at 44.1kHz sample rate |
| Mapping engine | ~86 Hz | Called on every Meyda callback |
| Parameter sender | 30 Hz | Rate-limited to avoid flooding |
| UI state updates | 10 Hz | Throttled to prevent React jank |

### What Scope Generates (Video FPS)

Depends on resolution and GPU:

| Resolution | Pixels | Expected FPS (RTX Pro 6000) |
|------------|--------|----------------------------|
| 320×576 | 184K | ~15-20 FPS |
| 768×448 | 344K | ~12-15 FPS |
| 512×512 | 262K | ~12-15 FPS |
| 1024×576 | 590K | ~6-10 FPS |

**Current Soundscape defaults** (dimensions must be divisible by 64):
- Widescreen (16:9): 768×448 → ~12-15 FPS
- Portrait (9:16): 320×576 → ~15-20 FPS (Daydream default)

### Why Low FPS Still Feels Smooth

Latent cache continuity creates **perceptual smoothness**. Each frame flows from the previous, so your brain fills in the gaps. 8 FPS with temporal coherence looks better than 30 FPS of random images.

---

## Denoising Steps

The `denoising_step_list` controls quality vs speed.

```typescript
// Current fixed setting (optimized for quality)
denoising_step_list: [1000, 750, 500, 250]
```

Each number is a timestep in the diffusion schedule:
- **1000**: High noise level (start of denoising)
- **750, 500**: Intermediate refinement steps
- **250**: Final cleanup

More steps = higher quality, slower. Fewer steps = faster, lower quality.

| Steps | Quality | Speed (RTX 6000) |
|-------|---------|------------------|
| `[1000, 750, 500, 250]` | High | ~15-20 FPS (4 denoising passes) ← **current** |
| `[1000, 500, 250]` | Good | ~20-25 FPS (3 denoising passes) |
| `[1000, 250]` | Acceptable | ~25-35 FPS (2 denoising passes) |

**We use fixed 4-step** for high quality visuals.

---

## Theme System

Each theme defines:

```typescript
{
  // What to generate (with flythrough motion language)
  basePrompt: "adventurous flythrough, dynamic camera movement, soaring through cosmic digital landscape...",
  styleModifiers: ["cinematic lighting", "volumetric fog"],

  // Parameter ranges
  ranges: {
    noiseScale: { min: 0.3, max: 0.95 },  // Low energy → 0.3, high → 0.95
  },

  // How audio maps to parameters
  mappings: {
    energy: [{ parameter: "noiseScale", curve: "exponential", sensitivity: 1.4 }],
    beats: { enabled: true, action: "pulse_noise", intensity: 0.5, cooldownMs: 200 }
  },

  // Prompt variations on energy spikes
  promptVariations: {
    trigger: "energy_spike",
    prompts: ["cosmic explosion, supernova burst", "wormhole opening, reality bending"],
    blendDuration: 6
  }
}
```

### Intensity Descriptors (Dynamic Prompt Modifiers)

Prompts are dynamically enhanced based on audio energy levels:

| Energy Level | Range | Example Descriptors |
|--------------|-------|---------------------|
| Low | 0-25% | "calm atmosphere", "serene ambiance", "gentle flow" |
| Medium | 25-50% | "dynamic energy", "flowing motion", "vibrant pulse" |
| High | 50-75% | "intense power", "explosive energy", "surging force" |
| Peak | 75-100% | "maximum intensity", "overwhelming power", "transcendent explosion" |

On beats, additional modifiers are added: "rhythmic pulse", "beat-synchronized flash", "percussive impact"

### Mapping Curves

| Curve | Effect |
|-------|--------|
| `linear` | Proportional response |
| `exponential` | More response at high values |
| `logarithmic` | More response at low values |
| `stepped` | Quantized (4 discrete levels) |

### Beat Actions

| Action | Effect |
|--------|--------|
| `pulse_noise` | Temporarily boost noise_scale (default for all themes) |
| `cache_reset` | Clear latent cache (dramatic jump, not used) |
| `prompt_cycle` | Cycle through prompt variations deterministically |
| `transition_trigger` | Cycle through prompt variations with blend (deterministic) |

**Note**: All prompt variation selection is now deterministic (cycling) instead of random to prevent jarring visual jumps.

---

## Prompt Transitions

When changing prompts (theme switch or beat trigger), Scope can blend smoothly:

```typescript
transition: {
  target_prompts: [
    { text: "new prompt here", weight: 0.6 },
    { text: "old prompt", weight: 0.4 }
  ],
  num_steps: 8,  // Blend over 8 frames
  temporal_interpolation_method: "slerp"  // Spherical interpolation
}
```

**SLERP** (Spherical Linear Interpolation) blends between latent representations smoothly, avoiding jarring cuts.

---

## Summary

| Mechanic | What It Does | We Control? |
|----------|--------------|-------------|
| Latent cache | Frame-to-frame memory | Yes (`manage_cache`, `reset_cache`) |
| Noise injection | How much change per frame | Yes (`noise_scale`) |
| Forward motion | Apparent camera movement | No (model behavior) |
| Transitions | Smooth prompt blending | Yes (`transition` object) |
| FPS | Video frame rate | Indirectly (resolution) |
| Quality | Image detail | Yes (`denoising_step_list`) |
