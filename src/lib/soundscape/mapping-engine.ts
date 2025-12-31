/**
 * Soundscape Mapping Engine
 * Translates audio analysis features into Scope generation parameters
 */

import type {
  Theme,
  AnalysisState,
  ScopeParameters,
  MappingTarget,
  MappingCurve,
  PromptEntry,
  NormalizationConfig,
} from "./types";

// ============================================================================
// Mapping Engine Class
// ============================================================================

// Intensity descriptors that get appended based on energy levels
// Reduced set to minimize prompt changes (each change triggers server recache)
const INTENSITY_DESCRIPTORS = {
  low: ["calm atmosphere", "gentle flow"],
  medium: ["dynamic energy", "flowing motion"],
  high: ["intense power", "surging force"],
  peak: ["maximum intensity", "transcendent energy"],
} as const;

// Temporal/positional variations to break attractor loops
// These cycle slowly (every ~5 seconds) to add variety without triggering constant recaches
const TEMPORAL_VARIATIONS = [
  "approaching distant formations",
  "passing through energy clouds",
  "structures emerging ahead",
  "particles streaming past",
  "light patterns shifting",
  "depth layers revealing",
] as const;

// Beat intensity modifiers
const BEAT_MODIFIERS = [
  "rhythmic pulse",
  "beat-synchronized flash",
  "percussive impact",
  "temporal surge",
] as const;

// Default transition frames for smooth prompt blending
const DEFAULT_PROMPT_TRANSITION_STEPS = 3;

export class MappingEngine {
  private theme: Theme;
  private normalization: NormalizationConfig;
  private lastParams: ScopeParameters | null = null;
  private smoothingFactor = 0.15; // Reduced for smoother transitions (was 0.3)

  // Beat handling
  private lastBeatTriggerTime = 0;
  private promptVariationIndex = 0;
  private currentPromptVariation: string | null = null;

  // Intensity tracking
  private lastIntensityLevel: "low" | "medium" | "high" | "peak" = "low";
  private intensityDescriptorIndex = 0;
  private beatModifierIndex = 0;
  private energySpikeVariationIndex = 0;

  // Temporal variation tracking (cycles VERY slowly to avoid visual resets)
  // Previous: 150 frames = 5s at 30Hz or 15s at 10Hz (ambient) - caused looping
  // New: 600 frames = 20s at 30Hz or 60s at 10Hz (ambient) - much longer cycles
  private temporalVariationIndex = 0;
  private framesSinceTemporalChange = 0;
  private readonly temporalChangeCycle = 600; // ~20 seconds at 30Hz, ~60s in ambient

  // Prompt transition tracking
  private lastPromptText: string | null = null;

  // Theme change flag - triggers cache reset on next parameter computation
  private pendingCacheReset = false;

  // Debug logging - track last logged theme to avoid spam
  private lastLoggedTheme: string | null = null;

  constructor(
    theme: Theme,
    normalization: NormalizationConfig = {
      energyMax: 0.15, // Lowered - typical RMS peaks at 0.1-0.2
      spectralCentroidMin: 100, // Lowered - catch bass-heavy content
      spectralCentroidMax: 6000, // Lowered for more sensitivity
      spectralFlatnessMax: 0.5,
    }
  ) {
    this.theme = theme;
    this.normalization = normalization;
  }

  /**
   * Update the active theme
   */
  setTheme(theme: Theme): void {
    const wasThemeChange = this.theme.id !== theme.id;
    const oldTheme = this.theme.id;
    this.theme = theme;
    this.promptVariationIndex = 0;
    this.currentPromptVariation = null;

    // Reset cache when theme changes to break out of previous visual "memory"
    if (wasThemeChange) {
      this.pendingCacheReset = true;
      // Also reset intensity and temporal tracking to start fresh
      this.lastIntensityLevel = "low";
      this.temporalVariationIndex = 0;
      this.framesSinceTemporalChange = 0;
      this.lastPromptText = null; // Force fresh prompt
      this.lastLoggedTheme = null; // Force next log

      console.log("[MappingEngine] 🔄 Theme changed:", oldTheme, "→", theme.id);
    }
  }

  /**
   * Get current theme ID (for debugging)
   */
  getCurrentThemeId(): string {
    return this.theme.id;
  }

  /**
   * Reset internal state for clean mode transitions (e.g., audio → ambient)
   * Preserves theme but resets all temporal/intensity tracking
   */
  resetState(): void {
    this.lastParams = null;
    this.lastBeatTriggerTime = 0;
    this.promptVariationIndex = 0;
    this.currentPromptVariation = null;
    this.lastIntensityLevel = "low";
    this.intensityDescriptorIndex = 0;
    this.beatModifierIndex = 0;
    this.energySpikeVariationIndex = 0;
    this.temporalVariationIndex = 0;
    this.framesSinceTemporalChange = 0;
    this.lastPromptText = null;
    this.pendingCacheReset = true; // Trigger fresh start
    console.log("[MappingEngine] State reset for mode transition");
  }

  /**
   * Update normalization configuration
   */
  setNormalization(config: Partial<NormalizationConfig>): void {
    this.normalization = { ...this.normalization, ...config };
  }

  /**
   * Compute Scope parameters from audio analysis
   */
  computeParameters(analysis: AnalysisState): ScopeParameters {
    // DEBUG: Log current theme on every call to catch any unexpected theme switches
    if (process.env.NODE_ENV === "development") {
      const themeId = this.theme.id;
      if (themeId === "cosmic-voyage") {
        console.warn("[MappingEngine] ⚠️ computeParameters called with COSMIC theme!");
        console.trace("[MappingEngine] Cosmic theme trace:");
      }
    }

    const { derived, beat } = analysis;

    // Compute base parameter values from mappings
    let noiseScale = this.computeMappedValue(
      "noiseScale",
      derived,
      this.theme.ranges.noiseScale
    );

    // Fixed denoising steps - 4-step schedule for high quality
    // Optimized for RTX 6000: ~15-20 fps
    const denoisingSteps = [1000, 750, 500, 250];

    // Handle beat effects
    const beatEffect = this.handleBeatEffects(beat, derived);
    if (beatEffect.noiseBoost) {
      noiseScale = Math.min(1.0, noiseScale + beatEffect.noiseBoost);
    }

    // Build prompts with intensity descriptors and beat awareness
    const prompts = this.buildPrompts(derived, beatEffect.promptOverride, beat.isBeat);

    // Determine if we need a smooth transition for prompt changes
    // Use beat effect transition if present, otherwise create one for prompt changes
    let transition = beatEffect.transition;
    const currentPromptText = prompts.map((p) => p.text).join("|");

    if (!transition && this.lastPromptText && currentPromptText !== this.lastPromptText) {
      // Prompt changed without a beat effect - add smooth transition
      transition = {
        target_prompts: prompts,
        num_steps: DEFAULT_PROMPT_TRANSITION_STEPS,
        temporal_interpolation_method: "slerp" as const,
      };
    }
    this.lastPromptText = currentPromptText;

    // Build final parameters
    // Note: vaceScale omitted - Soundscape uses text-only mode (no VACE)
    // Check for pending cache reset (e.g., from theme change)
    const shouldResetCache = beatEffect.resetCache || this.pendingCacheReset;
    if (this.pendingCacheReset) {
      this.pendingCacheReset = false; // Consume the flag
    }

    const params: ScopeParameters = {
      prompts,
      denoisingSteps,
      noiseScale,
      resetCache: shouldResetCache,
      transition,
    };

    // Apply smoothing
    const smoothed = this.smooth(params);
    this.lastParams = smoothed;

    return smoothed;
  }

  // ============================================================================
  // Private: Mapping Computation
  // ============================================================================

  private computeMappedValue(
    parameter: string,
    derived: AnalysisState["derived"],
    range: { min: number; max: number }
  ): number {
    let value = range.min;

    // Find all mappings that target this parameter
    const allMappings = [
      ...this.theme.mappings.energy.filter((m) => m.parameter === parameter),
      ...this.theme.mappings.brightness.filter((m) => m.parameter === parameter),
      ...this.theme.mappings.texture.filter((m) => m.parameter === parameter),
    ];

    if (allMappings.length === 0) {
      return range.min;
    }

    // Combine all mapping contributions
    let totalContribution = 0;
    let totalWeight = 0;

    for (const mapping of allMappings) {
      const sourceValue = this.getSourceValue(mapping, derived);
      const contribution = this.applyMapping(sourceValue, range, mapping);
      totalContribution += contribution * mapping.sensitivity;
      totalWeight += mapping.sensitivity;
    }

    if (totalWeight > 0) {
      value = totalContribution / totalWeight;
    }

    return Math.max(range.min, Math.min(range.max, value));
  }

  private getSourceValue(
    mapping: MappingTarget,
    derived: AnalysisState["derived"]
  ): number {
    // Determine which derived value to use based on where this mapping came from
    // This is a simplification - in practice we'd track which array the mapping came from
    // For now, we use the parameter to guess the source
    if (
      this.theme.mappings.energy.includes(mapping) ||
      mapping.parameter === "noiseScale"
    ) {
      return derived.energy;
    }
    if (
      this.theme.mappings.brightness.includes(mapping) ||
      mapping.parameter === "promptWeight"
    ) {
      return derived.brightness;
    }
    if (this.theme.mappings.texture.includes(mapping)) {
      return derived.texture;
    }
    return derived.energy;
  }

  private applyMapping(
    value: number,
    range: { min: number; max: number },
    mapping: MappingTarget
  ): number {
    // Apply inversion
    const scaled = mapping.invert ? 1 - value : value;

    // Apply curve
    const curved = this.applyCurve(scaled, mapping.curve);

    // Clamp
    const clamped = Math.max(0, Math.min(1, curved));

    // Map to range
    return range.min + (range.max - range.min) * clamped;
  }

  private applyCurve(value: number, curve: MappingCurve): number {
    switch (curve) {
      case "exponential":
        return Math.pow(value, 2); // More response at high end
      case "logarithmic":
        return Math.sqrt(value); // More response at low end
      case "stepped":
        return Math.floor(value * 4) / 4; // Quantized to 4 levels
      case "linear":
      default:
        return value;
    }
  }

  // ============================================================================
  // Private: Beat Effects
  // ============================================================================

  private handleBeatEffects(
    beat: AnalysisState["beat"],
    derived: AnalysisState["derived"]
  ): {
    noiseBoost: number;
    resetCache: boolean;
    promptOverride: string | null;
    transition: ScopeParameters["transition"];
  } {
    const result = {
      noiseBoost: 0,
      resetCache: false,
      promptOverride: null as string | null,
      transition: undefined as ScopeParameters["transition"],
    };

    const beatMapping = this.theme.mappings.beats;

    // Always apply a base noise boost on beats (regardless of configured action)
    // This makes beats universally more impactful
    if (beat.isBeat) {
      result.noiseBoost = 0.08; // Base beat response (reduced from 0.15 for stability)
    }

    if (!beatMapping.enabled || !beat.isBeat) {
      // Still check for energy spikes even without beat
      return this.handleEnergySpikeEffects(derived, result);
    }

    // Check cooldown
    const now = Date.now();
    const cooldown = beatMapping.cooldownMs || 200;
    const effectiveCooldown =
      beatMapping.action === "cache_reset" ? Math.max(cooldown, 400) : cooldown;

    if (now - this.lastBeatTriggerTime < effectiveCooldown) {
      return this.handleEnergySpikeEffects(derived, result);
    }

    this.lastBeatTriggerTime = now;

    // Apply beat action
    switch (beatMapping.action) {
      case "pulse_noise":
        // Reduced multiplier for stability (was 0.5, now 0.25)
        result.noiseBoost = Math.max(result.noiseBoost, beatMapping.intensity * 0.25);
        break;

      case "cache_reset":
        result.resetCache = true;
        // Also boost noise on cache reset for extra punch (reduced from 0.3)
        result.noiseBoost = Math.max(result.noiseBoost, 0.15);
        break;

      case "prompt_cycle":
        if (this.theme.promptVariations) {
          const variations = this.theme.promptVariations.prompts;
          this.promptVariationIndex =
            (this.promptVariationIndex + 1) % variations.length;
          this.currentPromptVariation = variations[this.promptVariationIndex];
          result.transition = {
            target_prompts: [
              { text: this.currentPromptVariation, weight: beatMapping.intensity },
              {
                text: this.buildBasePrompt(),
                weight: 1 - beatMapping.intensity,
              },
            ],
            num_steps: this.theme.promptVariations.blendDuration,
            temporal_interpolation_method: "slerp",
          };
        }
        result.noiseBoost = Math.max(result.noiseBoost, 0.1);
        break;

      case "transition_trigger":
        if (this.theme.promptVariations) {
          const variations = this.theme.promptVariations.prompts;
          // Deterministic cycling instead of random
          this.promptVariationIndex =
            (this.promptVariationIndex + 1) % variations.length;
          const nextVariation = variations[this.promptVariationIndex];
          result.transition = {
            target_prompts: [
              { text: nextVariation, weight: beatMapping.intensity },
              {
                text: this.buildBasePrompt(),
                weight: 1 - beatMapping.intensity,
              },
            ],
            num_steps: this.theme.promptVariations.blendDuration,
            temporal_interpolation_method: "slerp",
          };
        }
        result.noiseBoost = Math.max(result.noiseBoost, 0.1);
        break;
    }

    return this.handleEnergySpikeEffects(derived, result);
  }

  /**
   * Handle energy spike effects (separate from beat detection)
   * TESTING: Lowered threshold and increased variation weight for clear visual shift
   */
  private handleEnergySpikeEffects(
    derived: AnalysisState["derived"],
    result: {
      noiseBoost: number;
      resetCache: boolean;
      promptOverride: string | null;
      transition: ScopeParameters["transition"];
    }
  ): typeof result {
    // Energy spike detection - VERY LOW threshold for testing
    const energySpikeThreshold = 0.05; // Was 0.12 - lowered for more triggers

    if (
      this.theme.promptVariations?.trigger === "energy_spike" &&
      derived.energyDerivative > energySpikeThreshold
    ) {
      const variations = this.theme.promptVariations.prompts;
      // Deterministic cycling instead of random to avoid abrupt visual jumps
      this.energySpikeVariationIndex =
        (this.energySpikeVariationIndex + 1) % variations.length;
      const spikeVariation = variations[this.energySpikeVariationIndex];

      // Scale transition weight by how big the spike is
      const spikeIntensity = Math.min(1, derived.energyDerivative / 0.15); // Faster ramp to full intensity

      // TESTING: HIGH weight on variation (0.7-0.95) so color shift is OBVIOUS
      const variationWeight = 0.7 + spikeIntensity * 0.25;
      const baseWeight = 1 - variationWeight;

      // DEBUG: Log energy spikes
      if (process.env.NODE_ENV === "development") {
        console.log(
          `[MappingEngine] ⚡ ENERGY SPIKE! derivative=${derived.energyDerivative.toFixed(3)}, ` +
          `intensity=${spikeIntensity.toFixed(2)}, variationWeight=${variationWeight.toFixed(2)}, ` +
          `prompt="${spikeVariation.slice(0, 40)}..."`
        );
      }

      result.transition = {
        target_prompts: [
          { text: spikeVariation, weight: variationWeight },
          { text: this.buildBasePrompt(), weight: baseWeight },
        ],
        num_steps: this.theme.promptVariations.blendDuration,
        temporal_interpolation_method: "slerp",
      };

      // Also boost noise on energy spikes
      result.noiseBoost = Math.max(result.noiseBoost, spikeIntensity * 0.15);
    }

    return result;
  }

  // ============================================================================
  // Private: Prompt Building
  // ============================================================================

  private buildBasePrompt(): string {
    return [this.theme.basePrompt, ...this.theme.styleModifiers].join(", ");
  }

  /**
   * Get intensity level from energy value
   */
  private getIntensityLevel(energy: number): "low" | "medium" | "high" | "peak" {
    if (energy < 0.25) return "low";
    if (energy < 0.5) return "medium";
    if (energy < 0.75) return "high";
    return "peak";
  }

  /**
   * Get temporal variation that cycles slowly to break attractor loops
   */
  private getTemporalVariation(): string {
    this.framesSinceTemporalChange++;

    // Cycle temporal variation every ~5 seconds
    if (this.framesSinceTemporalChange >= this.temporalChangeCycle) {
      this.temporalVariationIndex =
        (this.temporalVariationIndex + 1) % TEMPORAL_VARIATIONS.length;
      this.framesSinceTemporalChange = 0;
    }

    return TEMPORAL_VARIATIONS[this.temporalVariationIndex];
  }

  /**
   * Get an intensity descriptor based on current energy level
   * Only changes when intensity level actually changes (reduces recache triggers)
   */
  private getIntensityDescriptor(energy: number, isBeat: boolean): string {
    const level = this.getIntensityLevel(energy);

    // Only change descriptor when intensity level ACTUALLY changes
    // Don't cycle within same level - reduces prompt changes that trigger recaching
    if (level !== this.lastIntensityLevel) {
      this.lastIntensityLevel = level;
      // Pick first descriptor for the new level (consistent, predictable)
      this.intensityDescriptorIndex = 0;
    }

    const baseDescriptor = INTENSITY_DESCRIPTORS[level][this.intensityDescriptorIndex];
    const temporalVariation = this.getTemporalVariation();

    // Combine: intensity + temporal (temporal adds variety without frequent changes)
    const combined = `${baseDescriptor}, ${temporalVariation}`;

    // Add beat modifier on beats for extra punch (deterministic cycling)
    if (isBeat) {
      this.beatModifierIndex = (this.beatModifierIndex + 1) % BEAT_MODIFIERS.length;
      const beatMod = BEAT_MODIFIERS[this.beatModifierIndex];
      return `${combined}, ${beatMod}`;
    }

    return combined;
  }

  private buildPrompts(
    derived: AnalysisState["derived"],
    promptOverride: string | null,
    isBeat: boolean = false
  ): PromptEntry[] {
    const basePrompt = this.buildBasePrompt();
    const intensityDescriptor = this.getIntensityDescriptor(derived.energy, isBeat);

    // Build the reactive prompt with intensity descriptor
    const reactivePrompt = `${basePrompt}, ${intensityDescriptor}`;

    if (promptOverride) {
      // Blend override with reactive base
      return [
        { text: promptOverride, weight: 0.4 },
        { text: reactivePrompt, weight: 0.6 },
      ];
    }

    // Return the reactive prompt with intensity modifier
    return [{ text: reactivePrompt, weight: 1.0 }];
  }

  // ============================================================================
  // Private: Smoothing
  // ============================================================================

  private smooth(target: ScopeParameters): ScopeParameters {
    if (!this.lastParams) {
      return target;
    }

    // Note: vaceScale omitted - Soundscape uses text-only mode (no VACE)
    return {
      ...target,
      noiseScale: this.lerp(
        this.lastParams.noiseScale,
        target.noiseScale,
        this.smoothingFactor
      ),
      // Don't smooth denoising steps - they change discretely
      denoisingSteps: target.denoisingSteps,
      // Don't smooth prompts - use Scope's transition system
      prompts: target.prompts,
    };
  }

  private lerp(a: number, b: number, t: number): number {
    return a + (b - a) * t;
  }
}

// ============================================================================
// Parameter Sender (Rate-Limited)
// ============================================================================

export class ParameterSender {
  private dataChannel: RTCDataChannel | null = null;
  private targetUpdateRate: number;
  private lastSendTime = 0;
  private pendingParams: ScopeParameters | null = null;
  private sendScheduled = false;
  private sendTimeoutId: ReturnType<typeof setTimeout> | null = null;

  constructor(updateRate = 30) {
    this.targetUpdateRate = updateRate;
  }

  /**
   * Set the data channel for sending parameters
   */
  setDataChannel(channel: RTCDataChannel | null): void {
    this.dataChannel = channel;

    if (process.env.NODE_ENV === "development") {
      console.log("[ParameterSender] Data channel set:", channel ? `readyState=${channel.readyState}` : "null");
    }

    if (!channel) {
      this.pendingParams = null;
      this.sendScheduled = false;
      if (this.sendTimeoutId) {
        clearTimeout(this.sendTimeoutId);
        this.sendTimeoutId = null;
      }
    }
  }

  /**
   * Clear any pending parameters (call on theme change to prevent stale params)
   */
  clearPending(): void {
    this.pendingParams = null;
    if (this.sendTimeoutId) {
      clearTimeout(this.sendTimeoutId);
      this.sendTimeoutId = null;
      this.sendScheduled = false;
    }
    if (process.env.NODE_ENV === "development") {
      console.log("[ParameterSender] Pending params cleared");
    }
  }

  /**
   * Queue parameters for sending. Rate-limited to targetUpdateRate.
   */
  send(params: ScopeParameters): void {
    this.pendingParams = params;

    if (!this.sendScheduled) {
      this.scheduleNextSend();
    }
  }

  private scheduleNextSend(): void {
    const now = performance.now();
    const minInterval = 1000 / this.targetUpdateRate;
    const elapsed = now - this.lastSendTime;
    const delay = Math.max(0, minInterval - elapsed);

    this.sendScheduled = true;

    this.sendTimeoutId = setTimeout(() => {
      this.sendScheduled = false;
      this.sendTimeoutId = null;

      if (!this.dataChannel || this.dataChannel.readyState !== "open") {
        if (process.env.NODE_ENV === "development" && this.pendingParams) {
          console.warn("[ParameterSender] Dropping params - channel not open:",
            this.dataChannel ? `state=${this.dataChannel.readyState}` : "no channel");
        }
        this.pendingParams = null;
        return;
      }

      if (this.pendingParams) {
        const formatted = this.formatParams(this.pendingParams);
        this.dataChannel.send(JSON.stringify(formatted));
        this.lastSendTime = performance.now();

        // Log cache resets (important for debugging theme changes)
        if (process.env.NODE_ENV === "development" && formatted.reset_cache) {
          console.log("[ParameterSender] Cache reset triggered");
        }

        this.pendingParams = null;
      }

      // If more params arrived while waiting, schedule again
      if (this.pendingParams) {
        this.scheduleNextSend();
      }
    }, delay);
  }

  // Track last logged theme for change detection
  private lastLoggedTheme: string | null = null;

  private formatParams(params: ScopeParameters): Record<string, unknown> {
    // Debug: Log theme identification (only when theme changes or ~every 10 seconds)
    if (process.env.NODE_ENV === "development") {
      const fullPrompt = params.prompts[0]?.text || "";
      // Extract key theme identifier from prompt
      let themeHint = "UNKNOWN";
      if (fullPrompt.includes("cosmic")) themeHint = "COSMIC";
      else if (fullPrompt.includes("foundry") || fullPrompt.includes("workshop")) themeHint = "FOUNDRY";
      else if (fullPrompt.includes("forest") || fullPrompt.includes("bioluminescent")) themeHint = "FOREST";
      else if (fullPrompt.includes("synthwave") || fullPrompt.includes("highway")) themeHint = "SYNTHWAVE";
      else if (fullPrompt.includes("sanctuary") || fullPrompt.includes("gothic castle")) themeHint = "SANCTUARY";

      // ALWAYS log if cosmic is detected (to catch the snap-back bug)
      if (themeHint === "COSMIC") {
        console.warn("[Scope] ⚠️ COSMIC DETECTED:", fullPrompt.slice(0, 80));
        console.trace("[Scope] Cosmic trace:");
      } else if (themeHint !== this.lastLoggedTheme) {
        // Log theme changes
        console.log("[Scope] Theme:", themeHint);
        this.lastLoggedTheme = themeHint;
      }
    }

    const formatted: Record<string, unknown> = {
      // Always send prompts - this is the target state
      prompts: params.prompts.map((p) => ({ text: p.text, weight: p.weight })),
      denoising_step_list: params.denoisingSteps,
      noise_scale: params.noiseScale,
      noise_controller: false, // We control noise manually
      manage_cache: true, // Let Scope manage its latent cache
      paused: false, // Ensure generation is running
    };

    // Note: vace_context_scale omitted - Soundscape uses text mode only (no VACE ref images)

    // Add transition for smooth blending when prompts change
    if (params.transition) {
      formatted.transition = params.transition;
    }

    if (params.resetCache) {
      formatted.reset_cache = true;
    }

    return formatted;
  }
}
