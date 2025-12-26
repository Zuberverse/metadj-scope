"use client";

import { useState, useEffect, useCallback } from "react";
import { getScopeClient } from "@/lib/scope";
import { DEFAULT_AVATAR_CONFIG, DEFAULT_GENERATION_PARAMS } from "@/lib/scope/types";
import { WebcamPreview } from "./WebcamPreview";
import { ReferenceImage } from "./ReferenceImage";
import { PromptEditor } from "./PromptEditor";
import { OutputPreview } from "./OutputPreview";

interface AvatarStudioProps {
  onConnectionChange: (connected: boolean) => void;
}

export function AvatarStudio({ onConnectionChange }: AvatarStudioProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [prompt, setPrompt] = useState(DEFAULT_AVATAR_CONFIG.promptTemplate);
  const [vaceScale, setVaceScale] = useState(DEFAULT_AVATAR_CONFIG.vaceScale);
  const [isStreaming, setIsStreaming] = useState(false);
  const [referenceImage, setReferenceImage] = useState<string>("/metadj-avatar-reference.png");

  // Check API connection on mount
  useEffect(() => {
    async function checkConnection() {
      setIsLoading(true);
      try {
        const client = getScopeClient();
        const health = await client.checkHealth();
        const connected = health.status === "ok";
        onConnectionChange(connected);
        if (!connected) {
          setError("Could not connect to Scope API. Check if RunPod instance is running.");
        } else {
          setError(null);
        }
      } catch (err) {
        console.error("[AvatarStudio] Connection check failed:", err);
        onConnectionChange(false);
        setError("Failed to connect to Scope API");
      } finally {
        setIsLoading(false);
      }
    }
    checkConnection();
  }, [onConnectionChange]);

  const handleStartStream = useCallback(async () => {
    setIsStreaming(true);
    // TODO: Implement stream creation with Scope API
    console.log("[AvatarStudio] Starting stream with:", {
      prompt,
      vaceScale,
      referenceImage,
      params: DEFAULT_GENERATION_PARAMS,
    });
  }, [prompt, vaceScale, referenceImage]);

  const handleStopStream = useCallback(() => {
    setIsStreaming(false);
    // TODO: Implement stream cleanup
    console.log("[AvatarStudio] Stopping stream");
  }, []);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-400">Connecting to Scope API...</div>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Left Column: Input */}
      <div className="space-y-4">
        <div className="bg-scope-surface rounded-lg p-4">
          <h2 className="text-lg font-semibold mb-4">Input</h2>

          {/* Webcam Preview */}
          <WebcamPreview />
        </div>

        {/* Reference Image */}
        <div className="bg-scope-surface rounded-lg p-4">
          <h2 className="text-lg font-semibold mb-4">Reference Image (VACE)</h2>
          <ReferenceImage
            src={referenceImage}
            onImageChange={setReferenceImage}
          />

          {/* VACE Scale */}
          <div className="mt-4">
            <label className="block text-sm text-gray-400 mb-2">
              VACE Scale: {vaceScale.toFixed(2)}
            </label>
            <input
              type="range"
              min="0"
              max="1"
              step="0.05"
              value={vaceScale}
              onChange={(e) => setVaceScale(parseFloat(e.target.value))}
              className="w-full"
            />
            <p className="text-xs text-gray-500 mt-1">
              Higher = stronger identity preservation
            </p>
          </div>
        </div>
      </div>

      {/* Center Column: Output */}
      <div className="bg-scope-surface rounded-lg p-4">
        <h2 className="text-lg font-semibold mb-4">Output</h2>

        {error && (
          <div className="mb-4 p-3 bg-scope-error/20 border border-scope-error rounded-lg text-sm">
            {error}
          </div>
        )}

        <OutputPreview isStreaming={isStreaming} />

        {/* Stream Controls */}
        <div className="mt-4 flex gap-2">
          {!isStreaming ? (
            <button
              onClick={handleStartStream}
              disabled={!!error}
              className="flex-1 py-3 bg-scope-accent hover:bg-scope-accent/80 disabled:bg-gray-600 disabled:cursor-not-allowed rounded-lg font-medium transition-colors"
            >
              Start Generation
            </button>
          ) : (
            <button
              onClick={handleStopStream}
              className="flex-1 py-3 bg-scope-error hover:bg-scope-error/80 rounded-lg font-medium transition-colors"
            >
              Stop
            </button>
          )}
        </div>
      </div>

      {/* Right Column: Controls */}
      <div className="space-y-4">
        <div className="bg-scope-surface rounded-lg p-4">
          <h2 className="text-lg font-semibold mb-4">Prompt</h2>
          <PromptEditor
            value={prompt}
            onChange={setPrompt}
            styleModifiers={DEFAULT_AVATAR_CONFIG.styleModifiers}
          />
        </div>

        {/* Quick Info */}
        <div className="bg-scope-surface rounded-lg p-4">
          <h2 className="text-lg font-semibold mb-4">Settings</h2>
          <div className="space-y-2 text-sm text-gray-400">
            <div className="flex justify-between">
              <span>Resolution</span>
              <span>{DEFAULT_GENERATION_PARAMS.width}×{DEFAULT_GENERATION_PARAMS.height}</span>
            </div>
            <div className="flex justify-between">
              <span>Steps</span>
              <span>{DEFAULT_GENERATION_PARAMS.numInferenceSteps}</span>
            </div>
            <div className="flex justify-between">
              <span>Guidance</span>
              <span>{DEFAULT_GENERATION_PARAMS.guidanceScale}</span>
            </div>
            <div className="flex justify-between">
              <span>Seed</span>
              <span>{DEFAULT_GENERATION_PARAMS.seed}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
