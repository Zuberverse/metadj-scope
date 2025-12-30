/**
 * Theme Selector Component
 * Visual theme selection for Soundscape
 */

"use client";

import { useState, useCallback } from "react";
import type { Theme, CustomThemeInput, ReactivityPreset, BeatResponse } from "@/lib/soundscape";

interface ThemeSelectorProps {
  themes: Theme[];
  currentTheme: Theme | null;
  onThemeChange: (themeIdOrInput: string | CustomThemeInput) => void;
  disabled?: boolean;
}

export function ThemeSelector({
  themes,
  currentTheme,
  onThemeChange,
  disabled = false,
}: ThemeSelectorProps) {
  const [showCustom, setShowCustom] = useState(false);
  const [customPrompt, setCustomPrompt] = useState("");
  const [reactivity, setReactivity] = useState<ReactivityPreset>("balanced");
  const [beatResponse, setBeatResponse] = useState<BeatResponse>("pulse");

  const handlePresetSelect = useCallback(
    (themeId: string) => {
      onThemeChange(themeId);
      setShowCustom(false);
    },
    [onThemeChange]
  );

  const handleCustomApply = useCallback(() => {
    if (!customPrompt.trim()) return;

    const customInput: CustomThemeInput = {
      prompt: customPrompt,
      reactivity,
      beatResponse,
    };
    onThemeChange(customInput);
  }, [customPrompt, reactivity, beatResponse, onThemeChange]);

  return (
    <div className="space-y-4">
      {/* Preset Themes Grid */}
      <div>
        <h3 className="text-sm font-medium text-gray-400 mb-2">Visual Themes</h3>
        <div className="grid grid-cols-2 gap-2">
          {themes.map((theme) => (
            <button
              key={theme.id}
              type="button"
              onClick={() => handlePresetSelect(theme.id)}
              disabled={disabled}
              aria-pressed={currentTheme?.id === theme.id}
              className={`
                p-3 rounded-lg text-left transition-all
                ${currentTheme?.id === theme.id
                  ? "bg-scope-purple/30 border-2 border-scope-purple"
                  : "bg-gray-800 border-2 border-transparent hover:border-gray-600"}
                ${disabled ? "opacity-50 cursor-not-allowed" : "cursor-pointer"}
              `}
            >
              <span className="block font-medium text-sm truncate">{theme.name}</span>
              <span className="block text-xs text-gray-400 truncate">
                {theme.description}
              </span>
            </button>
          ))}

          {/* Custom Theme Button */}
          <button
            type="button"
            onClick={() => setShowCustom(!showCustom)}
            disabled={disabled}
            aria-pressed={showCustom}
            className={`
              p-3 rounded-lg text-left transition-all
              ${showCustom
                ? "bg-scope-cyan/20 border-2 border-scope-cyan"
                : "bg-gray-800 border-2 border-dashed border-gray-600 hover:border-scope-cyan"}
              ${disabled ? "opacity-50 cursor-not-allowed" : "cursor-pointer"}
            `}
          >
            <span className="block font-medium text-sm">✨ Custom</span>
            <span className="block text-xs text-gray-400">Your own vision</span>
          </button>
        </div>
      </div>

      {/* Custom Theme Panel */}
      {showCustom && (
        <div className="bg-gray-800 rounded-lg p-4 space-y-4">
          <div>
            <label
              htmlFor="custom-prompt"
              className="block text-sm font-medium text-gray-300 mb-1"
            >
              Visual Description
            </label>
            <textarea
              id="custom-prompt"
              value={customPrompt}
              onChange={(e) => setCustomPrompt(e.target.value)}
              placeholder="Describe the visuals you want to see... e.g., 'underwater coral reef with bioluminescent creatures, floating particles'"
              disabled={disabled}
              className="w-full px-3 py-2 bg-gray-900 border border-gray-700 rounded-lg text-white placeholder-gray-500 resize-none focus:outline-none focus:border-scope-cyan"
              rows={3}
            />
          </div>

          {/* Reactivity Selector */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Audio Reactivity
            </label>
            <div className="flex gap-2">
              {(["subtle", "balanced", "intense", "chaotic"] as ReactivityPreset[]).map(
                (preset) => (
                  <button
                    key={preset}
                    type="button"
                    onClick={() => setReactivity(preset)}
                    disabled={disabled}
                    aria-pressed={reactivity === preset}
                    className={`
                      flex-1 py-1.5 px-2 rounded text-xs font-medium capitalize transition-all
                      ${reactivity === preset
                        ? "bg-scope-purple text-white"
                        : "bg-gray-700 text-gray-300 hover:bg-gray-600"}
                      ${disabled ? "opacity-50 cursor-not-allowed" : ""}
                    `}
                  >
                    {preset}
                  </button>
                )
              )}
            </div>
          </div>

          {/* Beat Response Selector */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Beat Response
            </label>
            <div className="flex gap-2">
              {(["none", "pulse", "shift", "burst"] as BeatResponse[]).map((response) => (
                  <button
                    key={response}
                    type="button"
                    onClick={() => setBeatResponse(response)}
                    disabled={disabled}
                    aria-pressed={beatResponse === response}
                    className={`
                      flex-1 py-1.5 px-2 rounded text-xs font-medium capitalize transition-all
                    ${beatResponse === response
                      ? "bg-scope-cyan text-black"
                      : "bg-gray-700 text-gray-300 hover:bg-gray-600"}
                    ${disabled ? "opacity-50 cursor-not-allowed" : ""}
                  `}
                >
                  {response}
                </button>
              ))}
            </div>
          </div>

          {/* Apply Button */}
          <button
            type="button"
            onClick={handleCustomApply}
            disabled={disabled || !customPrompt.trim()}
            className={`
              w-full py-2 rounded-lg font-medium transition-all
              ${disabled || !customPrompt.trim()
                ? "bg-gray-700 text-gray-500 cursor-not-allowed"
                : "bg-scope-cyan text-black hover:bg-scope-cyan/80"}
            `}
          >
            Apply Custom Theme
          </button>
        </div>
      )}
    </div>
  );
}
