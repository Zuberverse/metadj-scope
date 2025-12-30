import { describe, expect, it } from "vitest";
import { MappingEngine } from "./mapping-engine";
import { COSMIC_VOYAGE, NEON_FOUNDRY } from "./themes";
import type { AnalysisState } from "./types";

const makeAnalysis = (energy: number, isBeat = false): AnalysisState => ({
  features: {
    rms: 0,
    spectralCentroid: 0,
    spectralFlatness: 0,
    spectralRolloff: 0,
    zcr: 0,
  },
  beat: {
    bpm: null,
    confidence: 0,
    lastBeatTime: 0,
    isBeat,
  },
  derived: {
    energy,
    brightness: 0.5,
    texture: 0.5,
    energyDerivative: 0,
    peakEnergy: energy,
  },
});

// Fixed denoising steps matching Scope UI defaults
const FIXED_DENOISING_STEPS = [1000, 750, 500, 250];

describe("MappingEngine", () => {
  it("uses fixed denoising steps regardless of energy", () => {
    const engine = new MappingEngine(COSMIC_VOYAGE);

    // Low energy
    const lowParams = engine.computeParameters(makeAnalysis(0.1));
    expect(lowParams.denoisingSteps).toEqual(FIXED_DENOISING_STEPS);

    // High energy - same fixed steps
    const highParams = engine.computeParameters(makeAnalysis(0.9));
    expect(highParams.denoisingSteps).toEqual(FIXED_DENOISING_STEPS);
  });

  it("keeps noise scale within theme range", () => {
    const engine = new MappingEngine(COSMIC_VOYAGE);
    const params = engine.computeParameters(makeAnalysis(0.5));
    expect(params.noiseScale).toBeGreaterThanOrEqual(COSMIC_VOYAGE.ranges.noiseScale.min);
    expect(params.noiseScale).toBeLessThanOrEqual(COSMIC_VOYAGE.ranges.noiseScale.max);
  });

  it("sets resetCache on beat for cache_reset themes", () => {
    const engine = new MappingEngine(NEON_FOUNDRY);
    const params = engine.computeParameters(makeAnalysis(0.5, true));
    expect(params.resetCache).toBe(true);
  });
});
