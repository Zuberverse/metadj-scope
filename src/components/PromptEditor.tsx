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
    <div className="space-y-4">
      {/* Main Prompt */}
      <div>
        <label htmlFor="prompt-editor" className="block text-sm text-gray-400 mb-2">
          Generation Prompt
        </label>
        <textarea
          id="prompt-editor"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          rows={4}
          className="w-full bg-black border border-scope-border rounded-lg p-3 text-sm resize-none focus:outline-none focus:border-scope-accent"
          placeholder="Describe the avatar style..."
        />
      </div>

      {/* Style Modifiers */}
      <fieldset>
        <legend className="block text-sm text-gray-400 mb-2">
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
                className={`px-3 py-1 rounded-full text-xs transition-colors ${
                  isActive
                    ? "bg-scope-accent text-white"
                    : "bg-scope-border text-gray-400 hover:bg-scope-accent/50"
                }`}
              >
                {modifier}
              </button>
            );
          })}
        </div>
      </fieldset>

      {/* Quick Presets */}
      <fieldset>
        <legend className="block text-sm text-gray-400 mb-2">
          Quick Presets
        </legend>
        <div className="grid grid-cols-2 gap-2" role="group" aria-label="Prompt presets">
          <button
            type="button"
            onClick={() => onChange("A digital avatar of MetaDJ, cyberpunk style, neon lighting, futuristic DJ")}
            className="py-2 px-3 bg-scope-border hover:bg-scope-accent/50 rounded text-xs transition-colors"
          >
            Cyberpunk DJ
          </button>
          <button
            type="button"
            onClick={() => onChange("MetaDJ avatar, ethereal cosmic being, galaxy background, starlight")}
            className="py-2 px-3 bg-scope-border hover:bg-scope-accent/50 rounded text-xs transition-colors"
          >
            Cosmic
          </button>
          <button
            type="button"
            onClick={() => onChange("MetaDJ as a neon hologram, glowing wireframe, digital matrix")}
            className="py-2 px-3 bg-scope-border hover:bg-scope-accent/50 rounded text-xs transition-colors"
          >
            Hologram
          </button>
          <button
            type="button"
            onClick={() => onChange("Retro 80s MetaDJ, synthwave aesthetic, purple and pink, grid lines")}
            className="py-2 px-3 bg-scope-border hover:bg-scope-accent/50 rounded text-xs transition-colors"
          >
            Synthwave
          </button>
        </div>
      </fieldset>
    </div>
  );
}
