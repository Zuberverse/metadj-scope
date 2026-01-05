/**
 * Soundscape Page
 * Immersive full-screen experience for audio-reactive AI visuals
 */

"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { SoundscapeStudio } from "@/components/soundscape";

export default function SoundscapePage() {
  const [isConnected, setIsConnected] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        router.push("/");
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [router]);

  return (
    <div className="h-screen flex flex-col bg-scope-bg overflow-hidden relative">
      {/* Subtle ambient background - less prominent than homepage */}
      <div className="fixed inset-0 pointer-events-none z-0 opacity-50">
        <div className="glow-bg bg-scope-cyan/10 top-[-30%] right-[-20%]" />
        <div className="glow-bg bg-scope-purple/10 bottom-[-30%] left-[-20%] animation-delay-2000" />
      </div>

      {/* Header - Minimal but branded */}
      <header className="relative z-50 flex items-center justify-between px-4 md:px-6 py-3 border-b border-white/5 glass">
        {/* Left: Back + Branding */}
        <div className="flex items-center gap-4">
          <Link
            href="/"
            className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-white/50 hover:text-white hover:bg-white/5 transition-all duration-300 group"
          >
            <span className="text-lg transition-transform duration-300 group-hover:-translate-x-1">←</span>
            <span className="text-sm hidden sm:inline">Home</span>
          </Link>

          <div className="h-5 w-px bg-white/10" />

          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-scope-cyan/80 to-scope-purple/80 flex items-center justify-center text-sm shadow-lg shadow-scope-cyan/20">
              🎵
            </div>
            <div>
              <h1 className="font-display text-base font-semibold tracking-wide">Soundscape</h1>
              <p className="text-[9px] text-white/30 uppercase tracking-[0.15em] hidden sm:block">Audio-Reactive AI Visuals</p>
            </div>
          </div>
        </div>

        {/* Right: Connection Status */}
        <div className="flex items-center gap-3">
          {/* Connection indicator */}
          <div className="flex items-center gap-2 px-3 py-1.5 glass rounded-full border border-white/10">
            <div className="relative">
              <div
                className={`w-2 h-2 rounded-full transition-all duration-500 ${
                  isConnected
                    ? "bg-scope-cyan shadow-[0_0_10px_rgba(6,182,212,0.8)]"
                    : "bg-white/30"
                }`}
              />
              {isConnected && (
                <div className="absolute inset-0 w-2 h-2 rounded-full bg-scope-cyan animate-ping opacity-40" />
              )}
            </div>
            <span className={`text-[10px] font-medium uppercase tracking-wider ${
              isConnected ? 'text-scope-cyan' : 'text-white/40'
            }`}>
              {isConnected ? "Live" : "Offline"}
            </span>
          </div>

          {/* Keyboard shortcut hint */}
          <div className="hidden md:flex items-center gap-1.5 text-[10px] text-white/20">
            <kbd className="px-1.5 py-0.5 rounded bg-white/5 border border-white/10 font-mono">ESC</kbd>
            <span>to exit</span>
          </div>
        </div>
      </header>

      {/* Main Content - Full height video experience */}
      <main className="relative z-10 flex-1 min-h-0">
        <SoundscapeStudio onConnectionChange={setIsConnected} />
      </main>

      {/* Minimal Footer - Only visible when controls shown */}
      <footer className="relative z-10 px-4 py-2 border-t border-white/5 flex items-center justify-between text-[10px] text-white/20">
        <span>MetaDJ Scope • Daydream Hackathon</span>
        <div className="flex items-center gap-4">
          <span className="hidden sm:inline">Powered by StreamDiffusion</span>
          <a
            href="https://github.com/Zuberverse/metadj-scope"
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-white/40 transition-colors"
          >
            GitHub ↗
          </a>
        </div>
      </footer>
    </div>
  );
}
