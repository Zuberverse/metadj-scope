# Soundscape Technical Mechanics

**Last Modified**: 2026-01-03 EST
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
│                    - Beats           - transitions               │          │
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
| `manage_cache` | `boolean` | Keep latent cache (smooth) - always true |
| `transition` | `object` | Smooth prompt blending (used for all changes) |
| `denoising_step_list` | `number[]` | Quality/speed tradeoff |
| `paused` | `boolean` | Stop/start generation |

**Note**: `reset_cache` is NOT used in Soundscape - it causes hard visual cuts. We use smooth `transition` objects instead.

### noise_scale Explained

```
noise_scale = 0.0  →  No noise  →  Frozen image (no change)
noise_scale = 0.25 →  Low noise →  Subtle drift, very stable
noise_scale = 0.4  →  Medium    →  Smooth evolution
noise_scale = 0.6  →  Higher    →  Noticeable change (upper limit for stability)
noise_scale = 0.9+ →  Too high  →  Chaotic, breaks coherence (avoid!)
```

**In Soundscape**: Audio energy (loudness) drives noise_scale.
- Theme ranges tightened to **0.25–0.65** for stability (was 0.3–0.95)
- Beat boosts reduced to prevent ceiling hits
- Smoothing factor lowered for gradual transitions

### Cache Management (No Hard Cuts)

| Setting | Behavior | Status |
|---------|----------|--------|
| `manage_cache: true` | Preserve latent cache between frames | **Always used** |
| `reset_cache: true` | Clear cache (hard cut) | **Never used** - causes jarring visual jumps |

**Soundscape Philosophy**: We NEVER use `reset_cache`. All visual changes use smooth transitions:
- **Theme changes (music mode)**: 12-frame crossfade via MappingEngine `pendingThemeTransition`
- **Theme changes (ambient mode)**: 18-frame crossfade via atomic theme transition
- **Ambient reinforcement**: 3-frame micro-transitions every 1.5 seconds
- **Ambient start**: 12-frame transition for smooth visual initialization
- **Energy spikes**: 8-frame blended prompt transitions (unified blendDuration, with 3s cooldown)
- **Within-theme prompt changes**: 5-frame transition (DEFAULT_PROMPT_TRANSITION_STEPS)
- **Beats**: Noise boost only (no prompt changes, no cache resets)

**Critical Implementation Note**: Both audio analysis mode AND ambient mode must send a `transition` object when changing prompts. Without it, Scope does an immediate prompt change which causes a visual "jump" back to the new prompt's aesthetic before blending.

This ensures visuals always flow smoothly, even during theme changes and dramatic audio moments.

---

## Ambient Mode (No Audio Required)

Ambient mode generates continuous AI visuals without audio input. This mode is activated when:
- Scope is connected but no audio is playing
- User pauses audio playback

### The Problem with "Fire and Forget"

**Previous Approach (broken):**
```
T=0:    Send ONE prompt with 15-frame transition
T=5s:   Keep-alive: noise_scale only
T=10s:  Keep-alive: noise_scale only
...
T=?:    Model drifts, cache ages out → visual snap-back
```

The diffusion model needs **continuous prompt guidance** for temporal coherence. Without prompts, the model:
- Loses its "direction" in latent space
- May snap back to earlier states when cache is managed
- Can drift toward the initial session state (cosmic-voyage default)

### Continuous Prompt Reinforcement (Current Solution)

**Fixed Approach:**
```
T=0:      Send prompt with 12-frame transition (smooth start)
T=1.5s:   Send prompt with 3-frame transition (reinforcement)
T=3s:     Send prompt with 3-frame transition (reinforcement)
...       (continues every 1.5 seconds)
```

**Key Constants:**
```typescript
AMBIENT_INTERVAL_MS = 1500                    // Send full params every 1.5 seconds
AMBIENT_REINFORCE_TRANSITION_STEPS = 3        // Short transitions for stability
AMBIENT_THEME_CHANGE_TRANSITION_STEPS = 18    // Longer for theme crossfades
```

**Why This Works:**
- Model stays anchored to current theme (never drifts)
- Short 3-frame transitions maintain visual stability
- Theme changes can crossfade smoothly from a valid "from" state
- No gaps where the model is unguided

### Theme Changes in Ambient Mode

**Previous Approach (caused cosmos flash):**
```
1. clearPending()      ← Creates a gap
2. Send new theme prompt
3. Restart keep-alive interval
```

The `clearPending()` call created a moment where no prompts were queued. If the model had drifted, the transition would show: `drifted-state → new-theme` (cosmos flash).

**Fixed Approach (atomic transition):**
```
1. Send new theme prompt immediately (no clearing)
2. Interval picks up new theme from ref on next tick
```

Now transitions always show: `current-theme → new-theme` because the model is continuously reinforced with the current theme.

### Ambient Prompt Structure

Each ambient update sends:
```typescript
{
  prompts: [{ text: basePrompt + styleModifiers + "calm atmosphere, gentle flow", weight: 1.0 }],
  denoising_step_list: [1000, 800, 600, 400, 250],
  noise_scale: 0.48 + 0.04 * sin(phase),  // Subtle oscillation for organic feel
  transition: {
    target_prompts: prompts,
    num_steps: 3,  // Short for reinforcement, 12-18 for starts/theme changes
    temporal_interpolation_method: "slerp"
  },
  manage_cache: true,
  paused: false
}
```

### Mode Transitions

| From | To | Behavior |
|------|-----|----------|
| Audio playing | Audio paused | `stop()` → `startAmbient()` (seamless) |
| Ambient | Audio starts | `stopAmbient()` → `start()` (analyzer takes over) |
| Ambient | Theme change | Atomic prompt switch with 18-frame crossfade |

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
- Widescreen (16:9): 576×320 → ~15-20 FPS (Daydream default flipped)
- Portrait (9:16): 320×576 → ~15-20 FPS (Daydream default)

### Why Low FPS Still Feels Smooth

Latent cache continuity creates **perceptual smoothness**. Each frame flows from the previous, so your brain fills in the gaps. 8 FPS with temporal coherence looks better than 30 FPS of random images.

---

## Denoising Steps

The `denoising_step_list` controls quality vs speed.

```typescript
// Current fixed setting (optimized for quality)
denoising_step_list: [1000, 800, 600, 400, 250]
```

Each number is a timestep in the diffusion schedule:
- **1000**: High noise level (start of denoising)
- **800, 600, 400**: Intermediate refinement steps (more steps = sharper)
- **250**: Final cleanup

More steps = higher quality, slower. Fewer steps = faster, lower quality.

| Steps | Quality | Speed (RTX 6000) |
|-------|---------|------------------|
| `[1000, 800, 600, 400, 250]` | Higher | ~12-15 FPS (5 denoising passes) ← **current** |
| `[1000, 750, 500, 250]` | High | ~15-20 FPS (4 denoising passes) |
| `[1000, 500, 250]` | Good | ~20-25 FPS (3 denoising passes) |
| `[1000, 250]` | Acceptable | ~25-35 FPS (2 denoising passes) |

**We use fixed 5-step** for higher quality visuals with CSS post-processing sharpening.

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
    blendDuration: 8  // Unified across all themes
  }
}
```

### Intensity Descriptors (Static Prompt Modifiers)

Prompts include ONE static descriptor per energy level. **No cycling, no looping** - prompts only change when energy level actually changes:

| Energy Level | Range | Descriptor |
|--------------|-------|------------|
| Low | 0-25% | "calm atmosphere, gentle flow" |
| Medium | 25-50% | "dynamic energy, flowing motion" |
| High | 50-75% | "intense power, surging force" |
| Peak | 75-100% | "maximum intensity, transcendent energy" |

**Design Philosophy**: Prompts are completely stable within each energy level. Changes only occur on:
- Theme switches (user-initiated)
- Energy level transitions (audio-driven)
- Energy spikes (with 3s cooldown)

**Note**: Temporal variations and beat modifiers were REMOVED - prompts are now fully static per energy level. Beats only affect `noise_scale`.

### Mapping Curves

| Curve | Effect |
|-------|--------|
| `linear` | Proportional response |
| `exponential` | More response at high values |
| `logarithmic` | More response at low values |
| `stepped` | Quantized (4 discrete levels) |

### Beat Actions (Simplified)

**All beat actions now result in noise boosts only.** This prevents prompt churn while keeping beat responsiveness.

| Action in Theme | Actual Behavior | Intensity |
|-----------------|-----------------|-----------|
| `pulse_noise` | Boost noise_scale | 0.25 × intensity |
| `cache_reset` | Boost noise_scale (no cache reset!) | 0.35 × intensity |
| `prompt_cycle` | Boost noise_scale (no prompt change!) | 0.30 × intensity |
| `transition_trigger` | Boost noise_scale (no prompt change!) | 0.30 × intensity |

**Why**: Changing prompts on every beat caused excessive visual transitions. Beats are now felt through noise variation while prompt changes are reserved for energy spikes (with cooldown).

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
| Latent cache | Frame-to-frame memory | Yes (`manage_cache` = always true) |
| Noise injection | How much change per frame | Yes (`noise_scale`, audio-driven) |
| Forward motion | Apparent camera movement | No (model behavior) |
| Transitions | Smooth prompt blending | Yes (`transition` object, always used) |
| FPS | Video frame rate | Indirectly (resolution, denoising steps) |
| Quality | Image detail | Yes (`denoising_step_list` + CSS sharpening) |
| Beat response | Visual reactivity | Yes (noise boost only, no prompt changes) |
| Energy spikes | Dramatic visual shifts | Yes (prompt transitions with 3s cooldown) |
| Prompt stability | Static prompts per energy level | Yes (no cycling, no temporal variations) |

**Design Philosophy**:
- Smooth transitions everywhere - no hard cuts
- Beats are felt through noise, not prompt changes
- Prompts are static per energy level - no looping or cycling
- 5-step denoising + CSS sharpening for crisp visuals
