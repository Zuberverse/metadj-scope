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
    <div className="space-y-6">
      <div className="relative group overflow-hidden rounded-2xl border border-white/5 bg-black shadow-2xl">
        <video
          ref={videoRef}
          className="w-full aspect-square object-cover webcam-mirror transition-all duration-700 hover:scale-105"
          playsInline
          muted
        />

        {/* Dynamic Scanline Overlay */}
        <div className="absolute inset-0 pointer-events-none z-10 bg-gradient-to-b from-transparent via-white/5 to-transparent opacity-20 pointer-events-none" />
        <div className="absolute inset-0 pointer-events-none z-10 shadow-[inset_0_0_60px_rgba(0,0,0,0.8)]" />

        {!isActive && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/40 backdrop-blur-xl z-20">
            <div className="text-center animate-float">
              <div className="text-6xl mb-6 grayscale opacity-20">🎭</div>
              <p className="text-white/20 text-[10px] font-black uppercase tracking-[0.5em]">Input Disabled</p>
            </div>
          </div>
        )}
      </div>

      {error && (
        <div className="p-4 glass-radiant bg-red-950/20 border-red-500/30 rounded-2xl animate-bounce-subtle">
          <p className="text-red-200 text-[10px] font-black uppercase tracking-widest">{error}</p>
        </div>
      )}

      <div className="flex gap-3">
        {!isActive ? (
          <button
            type="button"
            onClick={startWebcam}
            className="flex-1 py-4 glass-radiant bg-scope-purple/20 hover:bg-scope-purple text-white/80 hover:text-white rounded-2xl text-[10px] font-black uppercase tracking-[0.4em] transition-all duration-500 hover:scale-105 active:scale-95 shadow-xl hover:shadow-[0_0_30px_rgba(139,92,246,0.3)]"
          >
            Initiate Stream
          </button>
        ) : (
          <button
            type="button"
            onClick={stopWebcam}
            className="flex-1 py-4 glass bg-white/5 hover:bg-white/10 border-white/5 rounded-2xl text-[10px] font-black uppercase tracking-[0.4em] text-white/20 hover:text-white transition-all duration-500 hover:scale-[0.98]"
          >
            Kill Process
          </button>
        )}
      </div>
    </div>
  );
}
