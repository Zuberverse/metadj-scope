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
    <div className="space-y-6">
      {/* Output Display */}
      <div
        className="relative aspect-[9/16] glass bg-black flex items-center justify-center overflow-hidden rounded-[2.5rem] border border-white/5 shadow-2xl group"
        role="region"
        aria-label="AI video output"
        aria-live="polite"
      >
        {/* Deep Inner Dimension Glow */}
        <div className="absolute inset-0 z-10 pointer-events-none shadow-[inset_0_0_120px_rgba(0,0,0,0.95)]" />

        {isStreaming ? (
          stream ? (
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              aria-label="AI-generated MetaDJ avatar stream"
              className="w-full h-full object-cover transition-transform duration-[2000ms] group-hover:scale-105"
            />
          ) : (
            <div className="text-center relative z-20 space-y-6" role="status" aria-live="assertive">
              <div className="relative">
                <div className="text-6xl mb-2 animate-float drop-shadow-[0_0_30px_rgba(255,255,255,0.4)]" aria-hidden="true">⚡</div>
                <div className="absolute inset-0 bg-white/20 blur-3xl rounded-full scale-150 animate-pulse-glow" />
              </div>
              <div className="space-y-2">
                <p className="text-white text-[11px] font-black uppercase tracking-[0.5em] text-pop">Binding Protocol</p>
                <p className="text-white/20 text-[9px] font-bold uppercase tracking-widest animate-pulse">
                  Initializing Neural Lattice
                </p>
              </div>
            </div>
          )
        ) : (
          <div className="text-center relative z-20 gap-8 flex flex-col items-center">
            <div className="relative">
              <div className="text-8xl opacity-10 animate-float" aria-hidden="true">🎭</div>
              <div className="absolute inset-0 bg-scope-purple/5 blur-3xl rounded-full scale-[2]" />
            </div>
            <div className="space-y-3">
              <p className="text-white/20 text-[10px] font-black uppercase tracking-[0.6em]">Standby Matrix</p>
              <p className="text-white/10 text-[8px] font-bold uppercase tracking-[0.4em] max-w-[200px] leading-relaxed">
                Connect your neural link to begin avatar projection
              </p>
            </div>
          </div>
        )}

        {/* Top-Right HUD element */}
        <div className="absolute top-6 right-6 z-30">
          <div className={`w-2 h-2 rounded-full ${isStreaming ? 'bg-scope-magenta shadow-[0_0_10px_rgba(236,72,153,0.8)] animate-pulse' : 'bg-white/10'}`} />
        </div>
      </div>

      {/* Stats Bar */}
      <div className="flex justify-between items-center px-4" aria-label="Stream statistics">
        <div className="flex items-center gap-4">
          <div className="flex flex-col gap-0.5">
            <span className="text-[8px] font-black text-white/20 uppercase tracking-widest">Temporal Density</span>
            <span className="text-[10px] font-bold text-white/40 font-mono">{isStreaming ? "≈ 30 FPS" : "STNBY"}</span>
          </div>
          <div className="h-6 w-px bg-white/5" />
          <div className="flex flex-col gap-0.5">
            <span className="text-[8px] font-black text-white/20 uppercase tracking-widest">Matrix Res</span>
            <span className="text-[10px] font-bold text-white/40 font-mono">{width}×{height}</span>
          </div>
        </div>
        <div className="flex flex-col items-end gap-0.5" aria-live="polite">
          <span className="text-[8px] font-black text-white/20 uppercase tracking-widest">Protocol State</span>
          <span className={`text-[10px] font-black uppercase tracking-widest ${isStreaming ? 'text-scope-purple text-pop' : 'text-white/10'}`}>
            {isStreaming ? "Active" : "Locked"}
          </span>
        </div>
      </div>
    </div>
  );
}
