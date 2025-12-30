/**
 * Analysis Meter Component
 * Real-time visualization of audio analysis metrics
 */

"use client";

import type { AnalysisState, ScopeParameters } from "@/lib/soundscape";

interface AnalysisMeterProps {
  analysis: AnalysisState | null;
  parameters: ScopeParameters | null;
  compact?: boolean;
}

interface MeterBarProps {
  label: string;
  value: number;
  color: string;
  showValue?: boolean;
}

function MeterBar({ label, value, color, showValue = true }: MeterBarProps) {
  const percentage = Math.round(value * 100);

  return (
    <div className="space-y-2">
      <div className="flex justify-between items-center text-[9px] font-black uppercase tracking-widest px-1">
        <span className="text-white/40">{label}</span>
        {showValue && <span className="text-white/60 text-pop">{percentage}%</span>}
      </div>
      <div className="h-1.5 glass bg-black/40 rounded-full overflow-hidden border border-white/5">
        <div
          className="h-full rounded-full transition-all duration-300 shadow-[0_0_10px_rgba(255,255,255,0.2)]"
          style={{
            width: `${percentage}%`,
            background: `linear-gradient(to right, ${color}cc, ${color})`,
            boxShadow: `0 0 15px ${color}66`,
          }}
        />
      </div>
    </div>
  );
}

export function AnalysisMeter({ analysis, parameters, compact = false }: AnalysisMeterProps) {
  const derived = analysis?.derived;
  const beat = analysis?.beat;

  // Compact mode for dock
  if (compact) {
    return (
      <div className="flex items-center gap-4">
        {/* Mini meters */}
        <div className="flex items-center gap-3 flex-1">
          <div className="flex items-center gap-1.5">
            <span className="text-[9px] text-gray-500">E</span>
            <div className="w-12 h-1.5 bg-white/10 rounded-full overflow-hidden">
              <div
                className="h-full bg-purple-500 rounded-full transition-all"
                style={{ width: `${Math.round((derived?.energy ?? 0) * 100)}%` }}
              />
            </div>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="text-[9px] text-gray-500">B</span>
            <div className="w-12 h-1.5 bg-white/10 rounded-full overflow-hidden">
              <div
                className="h-full bg-cyan-500 rounded-full transition-all"
                style={{ width: `${Math.round((derived?.brightness ?? 0) * 100)}%` }}
              />
            </div>
          </div>
        </div>

        {/* BPM */}
        <div className="flex items-center gap-2">
          <div className={`w-2 h-2 rounded-full ${beat?.isBeat ? "bg-pink-500 animate-ping" : "bg-gray-600"}`} />
          <span className="text-sm font-mono text-white">{beat?.bpm ?? "--"}</span>
          <span className="text-[9px] text-gray-500">BPM</span>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Audio Analysis Section */}
      <div className="space-y-6">
        <h4 className="text-[10px] font-black text-white/20 uppercase tracking-[0.4em] px-1">
          Spectral Data
        </h4>
        <div className="space-y-6">
          <MeterBar
            label="Energy"
            value={derived?.energy ?? 0}
            color="#A855F7" // Purple
          />
          <MeterBar
            label="Brightness"
            value={derived?.brightness ?? 0}
            color="#06B6D4" // Cyan
          />
          <MeterBar
            label="Texture"
            value={derived?.texture ?? 0}
            color="#EC4899" // Magenta
          />
        </div>
      </div>

      {/* Beat Detection Section */}
      <div className="space-y-6">
        <h4 className="text-[10px] font-black text-white/20 uppercase tracking-[0.4em] px-1">
          Temporal Sync
        </h4>
        <div className="flex items-center gap-6 glass bg-white/5 p-5 rounded-[2rem] border border-white/5 group">
          {/* Beat Indicator */}
          <div className="relative">
            <div
              className={`
                w-10 h-10 rounded-full transition-all duration-300 flex items-center justify-center text-xl
                ${beat?.isBeat ? "bg-scope-magenta shadow-[0_0_30px_rgba(236,72,153,0.6)] scale-110" : "bg-white/5 text-white/10"}
              `}
              aria-label={beat?.isBeat ? "Beat detected" : "No beat"}
            >
              {beat?.isBeat ? "⚡" : "•"}
            </div>
            {beat?.isBeat && (
              <div className="absolute inset-0 rounded-full border-2 border-scope-magenta animate-ping opacity-40 scale-150" />
            )}
          </div>

          {/* BPM Display */}
          <div className="flex-1 flex flex-col gap-0.5">
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-bold text-white tracking-tighter text-pop">
                {beat?.bpm ?? "--"}
              </span>
              <span className="text-[10px] font-black text-white/20 uppercase tracking-widest">BPM</span>
            </div>
            {beat?.confidence !== undefined && beat.confidence > 0 && (
              <div className="text-[9px] font-bold text-white/10 uppercase tracking-widest">
                Accuracy: {Math.round(beat.confidence * 100)}%
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Scope Parameters Section */}
      {parameters && (
        <div className="space-y-6">
          <h4 className="text-[10px] font-black text-white/20 uppercase tracking-[0.4em] px-1">
            Engine Config
          </h4>
          <div className="space-y-6">
            <MeterBar
              label="Diffusion Noise"
              value={parameters.noiseScale}
              color="#F59E0B" // Amber
            />
            {parameters.vaceScale !== undefined && (
              <MeterBar
                label="Identity Lock"
                value={parameters.vaceScale / 2} // Normalize 0-2 to 0-1
                color="#10B981" // Emerald
              />
            )}
          </div>

          {/* Denoising Steps */}
          <div className="pt-2 px-1 flex justify-between items-center">
            <span className="text-[9px] font-black uppercase tracking-widest text-white/20">Denoising Latency</span>
            <span className="text-[10px] font-bold text-white/40 font-mono tracking-tighter">
              [{parameters.denoisingSteps.join(", ")}]
            </span>
          </div>
        </div>
      )}

      {/* No Data State */}
      {!analysis && (
        <div className="text-center py-12 glass bg-white/5 rounded-[2rem] border border-white/5 border-dashed">
          <p className="text-[10px] font-black uppercase tracking-[0.4em] text-white/10">Awaiting Signal Ingest</p>
        </div>
      )}
    </div>
  );
}
