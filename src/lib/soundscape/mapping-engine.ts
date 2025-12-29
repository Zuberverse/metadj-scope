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

export class MappingEngine {
  private theme: Theme;
  private normalization: NormalizationConfig;
  private lastParams: ScopeParameters | null = null;
  private smoothingFactor = 0.15;

  // Beat handling
  private lastBeatTriggerTime = 0;
  private promptVariationIndex = 0;
  private currentPromptVariation: string | null = null;

  constructor(
    theme: Theme,
    normalization: NormalizationConfig = {
      energyMax: 0.5,
      spectralCentroidMin: 200,
      spectralCentroidMax: 8000,
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

    const vaceScale = this.computeMappedValue(
      "vaceScale",
      derived,
      this.theme.ranges.vaceScale
    );

    const denoisingSteps = this.computeDenoisingSteps(derived.energy);

    // Handle beat effects
    const beatEffect = this.handleBeatEffects(beat, derived);
    if (beatEffect.noiseBoost) {
      noiseScale = Math.min(1.0, noiseScale + beatEffect.noiseBoost);
    }

    // Build prompts
    const prompts = this.buildPrompts(derived, beatEffect.promptOverride);

    // Build final parameters
    const params: ScopeParameters = {
      prompts,
      denoisingSteps,
      noiseScale,
      vaceScale,
      resetCache: beatEffect.resetCache,
      transition: beatEffect.transition,
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
  // Private: Denoising Steps
  // ============================================================================

  private computeDenoisingSteps(energy: number): number[] {
    const { min, max } = this.theme.ranges.denoisingSteps;

    // Use energy to blend between fewer steps (fast) and more steps (quality)
    if (energy > 0.7) return max; // High energy: max quality
    if (energy < 0.3) return min; // Low energy: faster
    return energy > 0.5 ? max : min; // Simple threshold for MVP
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
    if (!beatMapping.enabled || !beat.isBeat) {
      return result;
    }

    // Check cooldown
    const now = Date.now();
    const cooldown = beatMapping.cooldownMs || 200;
    const effectiveCooldown =
      beatMapping.action === "cache_reset" ? Math.max(cooldown, 500) : cooldown;

    if (now - this.lastBeatTriggerTime < effectiveCooldown) {
      return result;
    }

    this.lastBeatTriggerTime = now;

    // Apply beat action
    switch (beatMapping.action) {
      case "pulse_noise":
        result.noiseBoost = beatMapping.intensity * 0.3;
        break;

      case "cache_reset":
        result.resetCache = true;
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
        break;

      case "transition_trigger":
        if (this.theme.promptVariations) {
          const variations = this.theme.promptVariations.prompts;
          const randomVariation =
            variations[Math.floor(Math.random() * variations.length)];
          result.transition = {
            target_prompts: [
              { text: randomVariation, weight: beatMapping.intensity },
              {
                text: this.buildBasePrompt(),
                weight: 1 - beatMapping.intensity,
              },
            ],
            num_steps: this.theme.promptVariations.blendDuration,
            temporal_interpolation_method: "slerp",
          };
        }
        break;
    }

    // Also check for energy spike triggers
    if (
      this.theme.promptVariations?.trigger === "energy_spike" &&
      derived.energyDerivative > 0.3
    ) {
      const variations = this.theme.promptVariations.prompts;
      const spikeVariation =
        variations[Math.floor(Math.random() * variations.length)];
      result.transition = {
        target_prompts: [
          { text: spikeVariation, weight: 0.6 },
          { text: this.buildBasePrompt(), weight: 0.4 },
        ],
        num_steps: this.theme.promptVariations.blendDuration,
        temporal_interpolation_method: "slerp",
      };
    }

    return result;
  }

  // ============================================================================
  // Private: Prompt Building
  // ============================================================================

  private buildBasePrompt(): string {
    return [this.theme.basePrompt, ...this.theme.styleModifiers].join(", ");
  }

  private buildPrompts(
    derived: AnalysisState["derived"],
    promptOverride: string | null
  ): PromptEntry[] {
    const basePrompt = this.buildBasePrompt();

    if (promptOverride) {
      // Blend override with base based on intensity
      return [
        { text: promptOverride, weight: 0.4 },
        { text: basePrompt, weight: 0.6 },
      ];
    }

    // Could add brightness-based prompt weight modulation here
    return [{ text: basePrompt, weight: 1.0 }];
  }

  // ============================================================================
  // Private: Smoothing
  // ============================================================================

  private smooth(target: ScopeParameters): ScopeParameters {
    if (!this.lastParams) {
      return target;
    }

    return {
      ...target,
      noiseScale: this.lerp(
        this.lastParams.noiseScale,
        target.noiseScale,
        this.smoothingFactor
      ),
      vaceScale: target.vaceScale
        ? this.lerp(
            this.lastParams.vaceScale || target.vaceScale,
            target.vaceScale,
            this.smoothingFactor
          )
        : undefined,
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

  constructor(updateRate = 30) {
    this.targetUpdateRate = updateRate;
  }

  /**
   * Set the data channel for sending parameters
   */
  setDataChannel(channel: RTCDataChannel): void {
    this.dataChannel = channel;
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

    setTimeout(() => {
      this.sendScheduled = false;

      if (
        this.pendingParams &&
        this.dataChannel?.readyState === "open"
      ) {
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
    const formatted: Record<string, unknown> = {
      prompts: params.prompts.map((p) => ({ text: p.text, weight: p.weight })),
      denoising_step_list: params.denoisingSteps,
      noise_scale: params.noiseScale,
      noise_controller: false, // We control noise manually
      manage_cache: true,
    };

    if (params.vaceScale !== undefined) {
      formatted.vace_context_scale = params.vaceScale;
    }

    if (params.transition) {
      formatted.transition = params.transition;
    }

    if (params.resetCache) {
      formatted.reset_cache = true;
    }

    return formatted;
  }
}
