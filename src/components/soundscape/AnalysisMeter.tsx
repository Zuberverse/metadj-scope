/**
 * Analysis Meter Component
 * Real-time visualization of audio analysis metrics
 */

"use client";

import type { AnalysisState, ScopeParameters } from "@/lib/soundscape";

interface AnalysisMeterProps {
  analysis: AnalysisState | null;
  parameters: ScopeParameters | null;
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
    <div className="space-y-1">
      <div className="flex justify-between text-xs">
        <span className="text-gray-400">{label}</span>
        {showValue && <span className="text-gray-500">{percentage}%</span>}
      </div>
      <div className="h-2 bg-gray-800 rounded-full overflow-hidden">
        <div
          className="h-full rounded-full transition-all duration-75"
          style={{
            width: `${percentage}%`,
            backgroundColor: color,
          }}
        />
      </div>
    </div>
  );
}

export function AnalysisMeter({ analysis, parameters }: AnalysisMeterProps) {
  const derived = analysis?.derived;
  const beat = analysis?.beat;

  return (
    <div className="space-y-4">
      {/* Audio Analysis Section */}
      <div>
        <h4 className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-3">
          Audio Analysis
        </h4>
        <div className="space-y-3">
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
      <div>
        <h4 className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-3">
          Beat Detection
        </h4>
        <div className="flex items-center gap-4">
          {/* Beat Indicator */}
          <div
            className={`
              w-4 h-4 rounded-full transition-all duration-75
              ${beat?.isBeat ? "bg-scope-magenta scale-125 shadow-lg shadow-scope-magenta/50" : "bg-gray-700"}
            `}
            aria-label={beat?.isBeat ? "Beat detected" : "No beat"}
          />

          {/* BPM Display */}
          <div className="flex-1">
            <div className="flex items-baseline gap-1">
              <span className="text-2xl font-bold text-white">
                {beat?.bpm ?? "—"}
              </span>
              <span className="text-xs text-gray-500">BPM</span>
            </div>
            {beat?.confidence !== undefined && beat.confidence > 0 && (
              <div className="text-xs text-gray-500">
                {Math.round(beat.confidence * 100)}% confident
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Scope Parameters Section */}
      {parameters && (
        <div>
          <h4 className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-3">
            Scope Parameters
          </h4>
          <div className="space-y-3">
            <MeterBar
              label="Noise Scale"
              value={parameters.noiseScale}
              color="#F59E0B" // Amber
            />
            {parameters.vaceScale !== undefined && (
              <MeterBar
                label="VACE Scale"
                value={parameters.vaceScale / 2} // Normalize 0-2 to 0-1
                color="#10B981" // Emerald
              />
            )}
          </div>

          {/* Denoising Steps */}
          <div className="mt-3">
            <div className="flex justify-between text-xs">
              <span className="text-gray-400">Denoising Steps</span>
              <span className="text-gray-500 font-mono">
                [{parameters.denoisingSteps.join(", ")}]
              </span>
            </div>
          </div>

          {/* Active Prompt Preview */}
          {parameters.prompts[0] && (
            <div className="mt-3 p-2 bg-gray-800 rounded text-xs">
              <span className="text-gray-400">Prompt: </span>
              <span className="text-gray-300 line-clamp-2">
                {parameters.prompts[0].text.slice(0, 100)}
                {parameters.prompts[0].text.length > 100 ? "..." : ""}
              </span>
            </div>
          )}
        </div>
      )}

      {/* No Data State */}
      {!analysis && (
        <div className="text-center py-8 text-gray-500">
          <p className="text-sm">Start playback to see analysis</p>
        </div>
      )}
    </div>
  );
}
