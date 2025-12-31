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
const INTENSITY_DESCRIPTORS = {
  low: ["calm atmosphere", "serene ambiance", "gentle flow", "peaceful drift"],
  medium: ["dynamic energy", "flowing motion", "vibrant pulse", "building momentum"],
  high: ["intense power", "explosive energy", "surging force", "electrifying burst"],
  peak: ["maximum intensity", "overwhelming power", "reality-bending force", "transcendent explosion"],
} as const;

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
  private smoothingFactor = 0.3; // Increased for snappier response

  // Beat handling
  private lastBeatTriggerTime = 0;
  private promptVariationIndex = 0;
  private currentPromptVariation: string | null = null;

  // Intensity tracking
  private lastIntensityLevel: "low" | "medium" | "high" | "peak" = "low";
  private intensityDescriptorIndex = 0;
  private framesSinceDescriptorChange = 0;
  private beatModifierIndex = 0;
  private energySpikeVariationIndex = 0;

  // Prompt transition tracking
  private lastPromptText: string | null = null;

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
    this.theme = theme;
    this.promptVariationIndex = 0;
    this.currentPromptVariation = null;
    // Don't reset lastPromptText - allows smooth transition to new theme
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
    const params: ScopeParameters = {
      prompts,
      denoisingSteps,
      noiseScale,
      resetCache: beatEffect.resetCache,
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
      result.noiseBoost = 0.15; // Base beat response
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
        // Increased from 0.3 to 0.5 multiplier for more visible effect
        result.noiseBoost = Math.max(result.noiseBoost, beatMapping.intensity * 0.5);
        break;

      case "cache_reset":
        result.resetCache = true;
        // Also boost noise on cache reset for extra punch
        result.noiseBoost = Math.max(result.noiseBoost, 0.3);
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
        result.noiseBoost = Math.max(result.noiseBoost, 0.2);
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
        result.noiseBoost = Math.max(result.noiseBoost, 0.2);
        break;
    }

    return this.handleEnergySpikeEffects(derived, result);
  }

  /**
   * Handle energy spike effects (separate from beat detection)
   * Lowered threshold from 0.3 to 0.12 for more frequent triggers
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
    // Energy spike detection - lowered threshold for more responsiveness
    const energySpikeThreshold = 0.12;

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
      const spikeIntensity = Math.min(1, derived.energyDerivative / 0.3);

      result.transition = {
        target_prompts: [
          { text: spikeVariation, weight: 0.4 + spikeIntensity * 0.3 },
          { text: this.buildBasePrompt(), weight: 0.6 - spikeIntensity * 0.3 },
        ],
        num_steps: this.theme.promptVariations.blendDuration,
        temporal_interpolation_method: "slerp",
      };

      // Also boost noise on energy spikes
      result.noiseBoost = Math.max(result.noiseBoost, spikeIntensity * 0.25);
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
   * Get an intensity descriptor based on current energy level
   * Cycles through descriptors to add variety
   */
  private getIntensityDescriptor(energy: number, isBeat: boolean): string {
    const level = this.getIntensityLevel(energy);
    this.framesSinceDescriptorChange++;

    // Change descriptor when intensity level changes or every ~60 frames (~2 sec)
    if (level !== this.lastIntensityLevel || this.framesSinceDescriptorChange > 60) {
      this.lastIntensityLevel = level;
      this.intensityDescriptorIndex =
        (this.intensityDescriptorIndex + 1) % INTENSITY_DESCRIPTORS[level].length;
      this.framesSinceDescriptorChange = 0;
    }

    const baseDescriptor = INTENSITY_DESCRIPTORS[level][this.intensityDescriptorIndex];

    // Add beat modifier on beats for extra punch (deterministic cycling, not random)
    if (isBeat) {
      this.beatModifierIndex = (this.beatModifierIndex + 1) % BEAT_MODIFIERS.length;
      const beatMod = BEAT_MODIFIERS[this.beatModifierIndex];
      return `${baseDescriptor}, ${beatMod}`;
    }

    return baseDescriptor;
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
        this.pendingParams = null;
        return;
      }

      if (this.pendingParams) {
        this.dataChannel.send(
          JSON.stringify(this.formatParams(this.pendingParams))
        );
        this.lastSendTime = performance.now();
        this.pendingParams = null;
      }

      // If more params arrived while waiting, schedule again
      if (this.pendingParams) {
        this.scheduleNextSend();
      }
    }, delay);
  }

  private formatParams(params: ScopeParameters): Record<string, unknown> {
    // Debug: Log prompt changes (first 80 chars)
    if (process.env.NODE_ENV === "development") {
      const promptPreview = params.prompts[0]?.text.slice(0, 80) + "...";
      console.log("[Scope] Sending prompt:", promptPreview);
    }

    const formatted: Record<string, unknown> = {
      // Always send prompts - this is the target state
      prompts: params.prompts.map((p) => ({ text: p.text, weight: p.weight })),
      denoising_step_list: params.denoisingSteps,
      noise_scale: params.noiseScale,
      noise_controller: false, // We control noise manually
      manage_cache: true,
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
