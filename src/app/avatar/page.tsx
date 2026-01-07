/**
 * Avatar Studio Page
 * Extreme Modernized UI - MetaDJ avatar generation with VACE identity lock
 */

"use client";

import { useState } from "react";
import Link from "next/link";
import dynamic from "next/dynamic";
import { ConnectionStatus } from "@/components/ConnectionStatus";

const AvatarStudio = dynamic(
  () => import("@/components/AvatarStudio").then((mod) => mod.AvatarStudio),
  {
    ssr: false,
    loading: () => (
      <div className="flex items-center justify-center min-h-[500px] glass-radiant rounded-[4rem] text-sm text-white/40 font-black uppercase tracking-[0.5em] animate-pulse">
        Initializing Neural Arc...
      </div>
    ),
  }
);

export default function AvatarPage() {
  const [isConnected, setIsConnected] = useState(false);

  return (
    <main
      id="main-content"
      className="min-h-screen p-6 md:p-12 relative overflow-hidden custom-scrollbar bg-scope-bg"
    >
      {/* Background Decor - Extreme Immersion */}
      <div className="glow-bg bg-scope-purple/15 top-[-30%] right-[-20%] scale-[2] -rotate-45" />
      <div className="glow-bg bg-scope-magenta/10 bottom-[-20%] left-[-10%] scale-[1.8] rotate-12" />
      <div className="glow-bg bg-scope-cyan/5 bottom-[30%] right-[-10%] scale-[1.2] opacity-20" />

      {/* Header Navigation */}
      <header className="mb-16 relative z-20">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-8">
          <div className="animate-float" style={{ animationDelay: '0.5s' }}>
            <div className="flex items-center gap-4 mb-4">
              <Link
                href="/"
                className="group flex items-center gap-3 text-[10px] font-black uppercase tracking-[0.4em] text-white/40 hover:text-white transition-all duration-500"
              >
                <div className="w-8 h-8 rounded-full border border-white/5 flex items-center justify-center glass group-hover:border-scope-purple/30 transition-colors">
                  <span className="text-lg transition-transform group-hover:-translate-x-1">←</span>
                </div>
                <span>Return to Hub</span>
              </Link>
            </div>
            <h1 className="text-5xl md:text-7xl font-bold chisel-gradient pb-3 tracking-tighter uppercase leading-none">
              Avatar Studio
            </h1>
            <p className="text-gray-400 text-xl font-medium text-pop opacity-80 mt-2">
              Identity-Locked AI MetaDJ Generation (VACE 2.0)
            </p>
          </div>

          <div className="flex items-center gap-6">
            <div className="glass-radiant px-8 py-4 rounded-[2rem] border-white/10 shadow-3xl flex items-center gap-4">
              <ConnectionStatus
                isConnected={isConnected}
                apiUrl={process.env.NEXT_PUBLIC_SCOPE_API_URL || "Not configured"}
              />
            </div>
          </div>
        </div>
      </header>

      {/* Main Studio Workspace - Extreme Glass */}
      <section className="relative z-10 glass-radiant rounded-[4rem] p-8 md:p-12 border-white/10 shadow-[0_0_120px_rgba(168,85,247,0.15)] overflow-hidden">
        {/* Decorative Internal Accents */}
        <div className="absolute top-0 left-0 w-1/3 h-1/2 bg-gradient-to-br from-white/[0.03] to-transparent pointer-events-none" />
        <div className="absolute bottom-0 right-0 w-1/2 h-1/4 bg-gradient-to-tl from-scope-purple/5 to-transparent pointer-events-none" />

        <AvatarStudio onConnectionChange={setIsConnected} />
      </section>

      {/* Methodology Section - Nexus Pattern */}
      <section className="mt-28 max-w-6xl mx-auto relative z-10 mb-20">
        <div className="flex flex-col items-center mb-16">
          <div className="flex items-center gap-6 mb-4">
            <div className="h-px w-24 bg-gradient-to-r from-transparent to-scope-purple/40" />
            <h2 className="text-xs font-black uppercase tracking-[0.6em] text-white/40">Neural Studio Methodology</h2>
            <div className="h-px w-24 bg-gradient-to-l from-transparent to-scope-purple/40" />
          </div>
          <p className="text-gray-500 text-sm font-medium tracking-wide">Character-consistent identity projection through neural mapping</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
          {[
            { emoji: "📷", step: "01", title: "Visual Stream", desc: "Enable full-spectrum neural ingest via high-definition video-to-video protocol." },
            { emoji: "🎭", step: "02", title: "Identity Lock", desc: "Configure VACE parameters to ensure character persistence across temporal frames." },
            { emoji: "✨", step: "03", title: "Synthesis", desc: "Real-time AI transformation into a high-fidelity MetaDJ digital avatar." }
          ].map((item, i) => (
            <div key={i} className="glass group p-10 rounded-[3rem] border-white/5 hover:border-scope-purple/20 transition-all duration-700 hover:scale-[1.03] interactive-scale">
              {/* Inner Glow Hover */}
              <div className="absolute inset-0 bg-scope-purple/5 opacity-0 group-hover:opacity-100 transition-opacity duration-700 rounded-[3rem] pointer-events-none" />

              <div className="relative z-10">
                <div className="text-6xl mb-10 group-hover:scale-110 transition-transform duration-700 group-hover:text-pop">{item.emoji}</div>
                <div className="text-[10px] font-black text-scope-purple tracking-[0.5em] mb-3">{item.step}</div>
                <h3 className="text-2xl font-bold mb-4 text-white font-display uppercase tracking-wider text-pop">{item.title}</h3>
                <p className="text-gray-400 text-base leading-relaxed font-medium group-hover:text-gray-200 transition-colors">
                  {item.desc}
                </p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Dedicated Page Footer */}
      <footer className="mt-32 text-center relative z-10 pb-16">
        <div className="h-px w-64 bg-gradient-to-r from-transparent via-white/10 to-transparent mx-auto mb-10" />
        <div className="flex flex-col gap-3">
          <p className="text-white/30 text-[9px] font-black tracking-[0.5em] uppercase">
            MetaDJ Avatar High-Fidelity Neural Workspace
          </p>
          <p className="text-white/20 text-[8px] font-bold tracking-[0.3em] uppercase">
            V2.0.4-STABLE // BUILD 2024.DEC // VACE: ENABLED
          </p>
        </div>
      </footer>
    </main>
  );
}
