"use client";

import { useCallback } from "react";

interface PromptEditorProps {
  value: string;
  onChange: (value: string) => void;
  styleModifiers: string[];
}

export function PromptEditor({ value, onChange, styleModifiers }: PromptEditorProps) {
  const handleModifierToggle = useCallback(
    (modifier: string) => {
      if (value.includes(modifier)) {
        // Remove modifier
        onChange(value.replace(`, ${modifier}`, "").replace(`${modifier}, `, "").replace(modifier, ""));
      } else {
        // Add modifier
        onChange(`${value}, ${modifier}`);
      }
    },
    [value, onChange]
  );

  return (
    <div className="space-y-8">
      {/* Main Prompt */}
      <div className="space-y-3">
        <label htmlFor="prompt-editor" className="text-[10px] font-black uppercase tracking-[0.4em] text-white/20 px-1">
          Neural Descriptor
        </label>
        <textarea
          id="prompt-editor"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          rows={4}
          className="w-full glass bg-black/40 border border-white/5 rounded-2xl p-4 text-sm resize-none focus:outline-none focus:border-scope-cyan/40 focus:ring-1 focus:ring-scope-cyan/20 transition-all duration-300 text-white placeholder:text-white/10"
          placeholder="Inject style parameters..."
        />
      </div>

      {/* Style Modifiers */}
      <fieldset className="space-y-4">
        <legend className="text-[10px] font-black uppercase tracking-[0.4em] text-white/20 px-1">
          Style Modifiers
        </legend>
        <div className="flex flex-wrap gap-2" role="group" aria-label="Toggle style modifiers">
          {styleModifiers.map((modifier) => {
            const isActive = value.includes(modifier);
            return (
              <button
                key={modifier}
                type="button"
                onClick={() => handleModifierToggle(modifier)}
                aria-pressed={isActive}
                className={`
                  px-4 py-2 rounded-full text-[9px] font-black uppercase tracking-widest transition-all duration-500 hover:scale-105 active:scale-95
                  ${isActive
                    ? "bg-scope-purple text-white shadow-[0_0_20px_rgba(139,92,246,0.3)] border-white/10"
                    : "glass text-white/40 hover:text-white border-white/5 hover:bg-white/5"}
                `}
              >
                {modifier}
              </button>
            );
          })}
        </div>
      </fieldset>

      {/* Quick Presets */}
      <fieldset className="space-y-4">
        <legend className="text-[10px] font-black uppercase tracking-[0.4em] text-white/20 px-1">
          Neural Presets
        </legend>
        <div className="grid grid-cols-2 gap-3" role="group" aria-label="Prompt presets">
          {[
            { label: "Cyberpunk DJ", prompt: "A digital avatar of MetaDJ, cyberpunk style, neon lighting, futuristic DJ" },
            { label: "Cosmic Essence", prompt: "MetaDJ avatar, ethereal cosmic being, galaxy background, starlight" },
            { label: "Holo Matrix", prompt: "MetaDJ as a neon hologram, glowing wireframe, digital matrix" },
            { label: "Vapor Grid", prompt: "Retro 80s MetaDJ, synthwave aesthetic, purple and pink, grid lines" }
          ].map((preset, i) => (
            <button
              key={i}
              type="button"
              onClick={() => onChange(preset.prompt)}
              className="group py-4 px-4 glass bg-white/5 hover:bg-scope-purple/10 border-white/5 hover:border-scope-purple/30 rounded-2xl text-[10px] font-black uppercase tracking-widest text-white/30 hover:text-white transition-all duration-500 hover:scale-[1.02] active:scale-95 text-left flex flex-col gap-1"
            >
              <span className="text-white group-hover:text-pop transition-all">{preset.label}</span>
              <span className="opacity-0 group-hover:opacity-100 transition-opacity text-[8px] text-scope-purple/60">Load Sequence</span>
            </button>
          ))}
        </div>
      </fieldset>
    </div>
  );
}
