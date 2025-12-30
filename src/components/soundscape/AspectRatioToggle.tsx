/**
 * Aspect Ratio Toggle Component
 * Switch between 16:9 widescreen and 9:16 portrait modes
 */

"use client";

import { AspectRatioConfig, ASPECT_PRESETS } from "@/lib/soundscape";

interface AspectRatioToggleProps {
  current: AspectRatioConfig;
  onChange: (config: AspectRatioConfig) => void;
  disabled?: boolean;
}

export function AspectRatioToggle({
  current,
  onChange,
  disabled = false,
}: AspectRatioToggleProps) {
  const isWidescreen = current.mode === "16:9";

  const handleToggle = () => {
    const newConfig = isWidescreen
      ? ASPECT_PRESETS.portrait
      : ASPECT_PRESETS.widescreen;
    onChange(newConfig);
  };

  return (
    <div className="flex items-center gap-3">
      <span className="text-sm text-gray-400">Aspect</span>
      <button
        type="button"
        onClick={handleToggle}
        disabled={disabled}
        className={`
          relative flex items-center gap-1.5 px-3 py-1.5 rounded-lg
          text-sm font-medium transition-all
          ${disabled
            ? "bg-gray-800 text-gray-600 cursor-not-allowed"
            : "bg-gray-800 hover:bg-gray-700 text-white"
          }
        `}
        aria-label={`Switch to ${isWidescreen ? "portrait" : "widescreen"} mode`}
      >
        {/* Widescreen Icon */}
        <div
          className={`
            w-5 h-3 border rounded-sm transition-colors
            ${isWidescreen
              ? "border-scope-cyan bg-scope-cyan/20"
              : "border-gray-600 bg-transparent"
            }
          `}
        />

        <span className="mx-1 text-gray-500">/</span>

        {/* Portrait Icon */}
        <div
          className={`
            w-3 h-5 border rounded-sm transition-colors
            ${!isWidescreen
              ? "border-scope-cyan bg-scope-cyan/20"
              : "border-gray-600 bg-transparent"
            }
          `}
        />
      </button>
      <span className="text-xs text-gray-500">
        {current.resolution.width}×{current.resolution.height}
      </span>
    </div>
  );
}
