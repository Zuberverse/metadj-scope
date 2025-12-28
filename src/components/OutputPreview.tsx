"use client";

import { useEffect, useRef } from "react";
import { DEFAULT_GENERATION_PARAMS } from "@/lib/scope/types";

interface OutputPreviewProps {
  isStreaming: boolean;
  stream: MediaStream | null;
}

export function OutputPreview({ isStreaming, stream }: OutputPreviewProps) {
  const width = DEFAULT_GENERATION_PARAMS.width ?? 320;
  const height = DEFAULT_GENERATION_PARAMS.height ?? 576;
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    if (!videoRef.current) return;

    if (stream) {
      videoRef.current.srcObject = stream;
    } else {
      videoRef.current.srcObject = null;
    }
  }, [stream]);

  return (
    <div className="space-y-3">
      {/* Output Display */}
      <div
        className="video-container relative bg-black flex items-center justify-center"
        role="region"
        aria-label="AI video output"
        aria-live="polite"
      >
        {isStreaming ? (
          stream ? (
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              aria-label="AI-generated MetaDJ avatar stream"
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="text-center" role="status" aria-live="assertive">
              <div className="animate-pulse text-4xl mb-2" aria-hidden="true">⚡</div>
              <p className="text-gray-400 text-sm">Connecting to Scope...</p>
              <p className="text-gray-500 text-xs mt-1">
                Initializing StreamDiffusion pipeline
              </p>
            </div>
          )
        ) : (
          <div className="text-center">
            <div className="text-6xl mb-4 opacity-50" aria-hidden="true">🎭</div>
            <p className="text-gray-400">AI Output</p>
            <p className="text-gray-500 text-xs mt-1">
              Start generation to see your MetaDJ avatar
            </p>
          </div>
        )}
      </div>

      {/* Stats Bar */}
      <div className="flex justify-between text-xs text-gray-500 px-1" aria-label="Stream statistics">
        <span>FPS: {isStreaming ? "Varies" : "N/A"}</span>
        <span>{width}×{height}</span>
        <span aria-live="polite">Status: {isStreaming ? "Running" : "Idle"}</span>
      </div>
    </div>
  );
}
