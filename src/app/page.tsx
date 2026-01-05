/**
 * MetaDJ Scope - Homepage
 * Immersive landing experience for AI video generation
 */

"use client";

import { useState } from "react";
import Link from "next/link";
import dynamic from "next/dynamic";
import { ConnectionStatus } from "@/components/ConnectionStatus";

type ExperienceMode = "soundscape" | "avatar";

const EXPERIENCES: Record<
  ExperienceMode,
  {
    title: string;
    subtitle: string;
    description: string;
    status: string;
    icon: string;
    color: "cyan" | "purple";
    href: string;
  }
> = {
  soundscape: {
    title: "Soundscape",
    subtitle: "Audio → Visuals",
    description: "Transform music into flowing AI-generated visuals. Real-time audio analysis drives the diffusion model.",
    status: "MVP Ready",
    icon: "🎵",
    color: "cyan",
    href: "/soundscape",
  },
  avatar: {
    title: "Avatar Studio",
    subtitle: "Identity → AI",
    description: "Generate MetaDJ avatar transformations with VACE identity preservation technology.",
    status: "MVP Ready",
    icon: "✨",
    color: "purple",
    href: "/avatar",
  },
};

const SoundscapeStudio = dynamic(
  () => import("@/components/soundscape").then((mod) => mod.SoundscapeStudio),
  {
    ssr: false,
    loading: () => (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="text-4xl mb-4 animate-float">✨</div>
          <p className="text-white/40 text-sm">Initializing Soundscape...</p>
        </div>
      </div>
    ),
  }
);

const AvatarStudio = dynamic(
  () => import("@/components/AvatarStudio").then((mod) => mod.AvatarStudio),
  {
    ssr: false,
    loading: () => (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="text-4xl mb-4 animate-float">✨</div>
          <p className="text-white/40 text-sm">Initializing Avatar Studio...</p>
        </div>
      </div>
    ),
  }
);

export default function Home() {
  const [focus, setFocus] = useState<ExperienceMode>("soundscape");
  const [soundscapeConnected, setSoundscapeConnected] = useState(false);
  const [avatarConnected, setAvatarConnected] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const focusedExperience = EXPERIENCES[focus];
  const isFocusedConnected =
    focus === "soundscape" ? soundscapeConnected : avatarConnected;

  return (
    <div className="min-h-screen flex flex-col relative overflow-hidden">
      {/* Ambient Background */}
      <div className="fixed inset-0 pointer-events-none z-0">
        <div className="glow-bg bg-scope-purple/20 top-[-20%] left-[-10%]" />
        <div className="glow-bg bg-scope-cyan/15 bottom-[-20%] right-[-10%] animation-delay-2000" />
        <div className="glow-bg bg-scope-magenta/10 top-[40%] right-[20%] animation-delay-4000" style={{ width: '40vw', height: '40vw' }} />
      </div>

      {/* Header */}
      <header className="relative z-10 flex items-center justify-between px-6 md:px-12 py-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-scope-purple to-scope-cyan flex items-center justify-center text-lg font-bold shadow-lg shadow-scope-purple/30">
            M
          </div>
          <div>
            <h1 className="font-display text-lg font-semibold tracking-wide">MetaDJ Scope</h1>
            <p className="text-[10px] text-white/40 uppercase tracking-[0.2em]">AI Video Engine</p>
          </div>
        </div>
        {/* Desktop Navigation */}
        <nav aria-label="Main navigation" className="hidden md:flex items-center gap-6">
          <Link href="/soundscape" className="text-sm text-white/60 hover:text-white transition-colors">
            Soundscape
          </Link>
          <Link href="/avatar" className="text-sm text-white/60 hover:text-white transition-colors">
            Avatar
          </Link>
          <a
            href="https://github.com/Zuberverse/metadj-scope"
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm text-white/60 hover:text-white transition-colors"
          >
            GitHub
          </a>
        </nav>

        {/* Mobile Menu Button */}
        <button
          type="button"
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="md:hidden p-2 text-white/60 hover:text-white transition-colors"
          aria-expanded={mobileMenuOpen}
          aria-label={mobileMenuOpen ? "Close menu" : "Open menu"}
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            {mobileMenuOpen ? (
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            ) : (
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            )}
          </svg>
        </button>
      </header>

      {/* Mobile Navigation Menu */}
      {mobileMenuOpen && (
        <nav
          aria-label="Mobile navigation"
          className="md:hidden relative z-20 glass border-b border-white/10"
        >
          <div className="flex flex-col px-6 py-4 space-y-3">
            <Link
              href="/soundscape"
              onClick={() => setMobileMenuOpen(false)}
              className="text-sm text-white/60 hover:text-white transition-colors py-2"
            >
              Soundscape
            </Link>
            <Link
              href="/avatar"
              onClick={() => setMobileMenuOpen(false)}
              className="text-sm text-white/60 hover:text-white transition-colors py-2"
            >
              Avatar
            </Link>
            <a
              href="https://github.com/Zuberverse/metadj-scope"
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => setMobileMenuOpen(false)}
              className="text-sm text-white/60 hover:text-white transition-colors py-2"
            >
              GitHub
            </a>
          </div>
        </nav>
      )}

      {/* Main Content */}
      <main id="main-content" role="main">
      {/* Hero Section */}
      <section className="relative z-10 text-center px-6 py-12 md:py-16" aria-labelledby="hero-heading">
        <div className="inline-block mb-6">
          <span className="px-4 py-1.5 glass rounded-full text-[10px] font-bold uppercase tracking-[0.3em] text-scope-cyan border border-scope-cyan/30">
            Daydream Scope Hackathon
          </span>
        </div>
        <h2 id="hero-heading" className="text-4xl md:text-6xl lg:text-7xl font-display font-bold mb-6 leading-tight">
          <span className="chisel-gradient">Real-Time AI</span>
          <br />
          <span className="text-white">Video Generation</span>
        </h2>
        <p className="text-white/50 text-lg md:text-xl max-w-2xl mx-auto leading-relaxed">
          Transform audio into flowing visuals. Generate AI avatars in real-time.
          Powered by StreamDiffusion and Daydream Scope.
        </p>
      </section>

      {/* Experience Selector */}
      <section className="relative z-10 px-6 md:px-12 py-8">
        <div className="max-w-5xl mx-auto">
          <h3 className="text-[11px] font-bold uppercase tracking-[0.3em] text-white/30 mb-6 text-center">
            Choose Your Experience
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
            {(Object.keys(EXPERIENCES) as ExperienceMode[]).map((mode) => {
              const exp = EXPERIENCES[mode];
              const isCyan = exp.color === "cyan";
              const isActive = focus === mode;

              return (
                <button
                  key={mode}
                  type="button"
                  aria-pressed={isActive}
                  onClick={() => setFocus(mode)}
                  className={`
                    group relative overflow-hidden rounded-2xl p-6 md:p-8 text-left transition-all duration-500
                    ${isActive
                      ? `glass-radiant ${isCyan ? 'border-scope-cyan/50 shadow-[0_0_40px_rgba(6,182,212,0.2)]' : 'border-scope-purple/50 shadow-[0_0_40px_rgba(139,92,246,0.2)]'}`
                      : 'glass hover:bg-white/5'}
                    hover:scale-[1.02] active:scale-[0.98]
                  `}
                >
                  {/* Hover glow effect */}
                  <div className={`
                    absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none
                    ${isCyan ? 'bg-scope-cyan/5' : 'bg-scope-purple/5'}
                  `} />

                  <div className="relative z-10">
                    {/* Top row: Icon + Status */}
                    <div className="flex items-start justify-between mb-4">
                      <div className={`
                        w-14 h-14 rounded-2xl flex items-center justify-center text-2xl
                        ${isActive
                          ? `${isCyan ? 'bg-scope-cyan/20 shadow-[0_0_20px_rgba(6,182,212,0.3)]' : 'bg-scope-purple/20 shadow-[0_0_20px_rgba(139,92,246,0.3)]'}`
                          : 'bg-white/5'}
                        transition-all duration-500 group-hover:scale-110
                      `}>
                        {exp.icon}
                      </div>
                      <span className={`
                        text-[9px] font-bold uppercase tracking-[0.15em] px-3 py-1.5 rounded-full
                        ${isActive
                          ? `${isCyan ? 'bg-scope-cyan/20 text-scope-cyan' : 'bg-scope-purple/20 text-scope-purple'}`
                          : 'bg-white/5 text-white/40'}
                      `}>
                        {exp.status}
                      </span>
                    </div>

                    {/* Title + Subtitle */}
                    <div className="mb-3">
                      <h4 className={`
                        text-xl md:text-2xl font-display font-semibold mb-1
                        ${isActive ? 'text-white' : 'text-white/80'}
                      `}>
                        {exp.title}
                      </h4>
                      <p className={`
                        text-sm font-medium
                        ${isActive
                          ? `${isCyan ? 'text-scope-cyan' : 'text-scope-purple'}`
                          : 'text-white/40'}
                      `}>
                        {exp.subtitle}
                      </p>
                    </div>

                    {/* Description */}
                    <p className="text-sm text-white/40 leading-relaxed mb-4">
                      {exp.description}
                    </p>

                    {/* Action hint */}
                    <div className="flex items-center gap-2 text-sm">
                      <span className={`
                        ${isActive
                          ? `${isCyan ? 'text-scope-cyan' : 'text-scope-purple'}`
                          : 'text-white/30 group-hover:text-white/50'}
                        transition-colors
                      `}>
                        {isActive ? "Currently Active" : "Click to Focus"}
                      </span>
                      <span className={`
                        transition-transform duration-300
                        ${isActive ? 'opacity-0' : 'group-hover:translate-x-1'}
                      `}>
                        →
                      </span>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      </section>

      {/* Active Studio Section */}
      <section className="relative z-10 flex-1 px-4 md:px-8 pb-8">
        <div className="max-w-7xl mx-auto">
          {/* Section Header */}
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-4 px-2">
            <div className="flex items-center gap-4">
              <div className={`
                w-3 h-3 rounded-full
                ${isFocusedConnected
                  ? 'bg-scope-cyan shadow-[0_0_12px_rgba(6,182,212,0.8)] animate-pulse'
                  : 'bg-white/20'}
              `} />
              <div>
                <h3
                  className="text-xl md:text-2xl font-display font-semibold"
                  data-testid="focus-heading"
                  aria-live="polite"
                  aria-atomic="true"
                >
                  {focusedExperience.title}
                </h3>
                <p className="text-sm text-white/40">{focusedExperience.subtitle}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Link
                href={focusedExperience.href}
                className="px-4 py-2 glass hover:bg-white/10 text-sm text-white/60 hover:text-white rounded-xl transition-all duration-300 border border-white/10 hover:border-white/20"
              >
                Open Fullscreen ↗
              </Link>
              <ConnectionStatus
                isConnected={isFocusedConnected}
                apiUrl={process.env.NEXT_PUBLIC_SCOPE_API_URL || "Not configured"}
              />
            </div>
          </div>

          {/* Studio Container */}
          <div className="glass-radiant rounded-2xl overflow-hidden min-h-[500px]">
            {focus === "soundscape" ? (
              <SoundscapeStudio onConnectionChange={setSoundscapeConnected} />
            ) : (
              <AvatarStudio onConnectionChange={setAvatarConnected} />
            )}
          </div>
        </div>
      </section>

      </main>

      {/* Footer */}
      <footer className="relative z-10 px-6 md:px-12 py-8 border-t border-white/5">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-6">
            <span className="text-sm text-white/30">
              Built for Daydream Scope Track Hackathon
            </span>
            <span className="hidden md:inline text-white/10">|</span>
            <span className="hidden md:inline text-sm text-white/30">
              Dec 2024 - Jan 2025
            </span>
          </div>
          <div className="flex items-center gap-6">
            <a
              href="https://metadj.ai"
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm text-white/40 hover:text-white/70 transition-colors"
            >
              MetaDJ
            </a>
            <a
              href="https://zuberant.com"
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm text-white/40 hover:text-white/70 transition-colors"
            >
              Zuberant
            </a>
            <a
              href="https://github.com/Zuberverse/metadj-scope"
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm text-white/40 hover:text-white/70 transition-colors"
            >
              Source Code
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
}
