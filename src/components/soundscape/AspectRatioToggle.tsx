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
    <button
      type="button"
      onClick={handleToggle}
      disabled={disabled}
      className={`
        relative flex items-center gap-1 px-2 py-1 rounded border
        text-[9px] font-medium uppercase tracking-wide transition-all duration-300
        ${disabled
          ? "glass bg-white/5 text-white/30 border-white/10 cursor-not-allowed"
          : "glass bg-white/5 hover:bg-white/10 text-white/60 border-white/10 hover:border-scope-cyan/30"
        }
      `}
      aria-label={`Switch to ${isWidescreen ? "portrait" : "widescreen"} mode`}
    >
      {/* Widescreen Icon */}
      <div
        className={`
          w-3.5 h-2 border rounded-sm transition-all duration-300
          ${isWidescreen
            ? "border-scope-cyan bg-scope-cyan/30"
            : "border-white/30 bg-transparent"
          }
        `}
      />

      <span className="text-white/20">/</span>

      {/* Portrait Icon */}
      <div
        className={`
          w-2 h-3.5 border rounded-sm transition-all duration-300
          ${!isWidescreen
            ? "border-scope-cyan bg-scope-cyan/30"
            : "border-white/30 bg-transparent"
          }
        `}
      />
    </button>
  );
}
