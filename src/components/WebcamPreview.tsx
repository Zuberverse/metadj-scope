"use client";

import { useRef, useEffect, useState, useCallback } from "react";

interface WebcamPreviewProps {
  onStreamReady?: (stream: MediaStream) => void;
  onStreamStop?: () => void;
  preferredWidth?: number;
  preferredHeight?: number;
  preferredFrameRate?: number;
}

export function WebcamPreview({
  onStreamReady,
  onStreamStop,
  preferredWidth,
  preferredHeight,
  preferredFrameRate,
}: WebcamPreviewProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isActive, setIsActive] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const startWebcam = useCallback(async () => {
    try {
      const width = preferredWidth ?? 512;
      const height = preferredHeight ?? 512;
      const frameRate = preferredFrameRate ?? 15;
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          width: { ideal: width },
          height: { ideal: height },
          frameRate: { ideal: frameRate, max: Math.max(frameRate, 20) },
          facingMode: "user",
        },
        audio: false,
      });

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
        setIsActive(true);
        setError(null);
        onStreamReady?.(stream);
      }
    } catch (err) {
      console.error("[Webcam] Failed to start:", err);
      setError("Could not access webcam. Please check permissions.");
    }
  }, [onStreamReady, preferredWidth, preferredHeight, preferredFrameRate]);

  const stopWebcam = useCallback(() => {
    if (videoRef.current?.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream;
      stream.getTracks().forEach((track) => track.stop());
      videoRef.current.srcObject = null;
      setIsActive(false);
      onStreamStop?.();
    }
  }, [onStreamStop]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopWebcam();
    };
  }, [stopWebcam]);

  return (
    <div className="space-y-3">
      <div className="video-container relative bg-black">
        <video
          ref={videoRef}
          className="w-full h-full object-cover webcam-mirror"
          playsInline
          muted
        />

        {!isActive && (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-center">
              <div className="text-4xl mb-2">📷</div>
              <p className="text-gray-400 text-sm">Webcam Off</p>
            </div>
          </div>
        )}
      </div>

      {error && (
        <div className="p-2 bg-scope-error/20 border border-scope-error rounded text-xs text-scope-error">
          {error}
        </div>
      )}

      <div className="flex gap-2">
        {!isActive ? (
          <button
            type="button"
            onClick={startWebcam}
            className="flex-1 py-2 bg-scope-accent hover:bg-scope-accent/80 rounded text-sm font-medium transition-colors"
          >
            Start Webcam
          </button>
        ) : (
          <button
            type="button"
            onClick={stopWebcam}
            className="flex-1 py-2 bg-gray-600 hover:bg-gray-500 rounded text-sm font-medium transition-colors"
          >
            Stop Webcam
          </button>
        )}
      </div>
    </div>
  );
}
