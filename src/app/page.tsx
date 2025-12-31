"use client";

import { useState } from "react";
import dynamic from "next/dynamic";
import { ConnectionStatus } from "@/components/ConnectionStatus";

type ExperienceMode = "soundscape" | "avatar";

const EXPERIENCES: Record<
  ExperienceMode,
  { title: string; subtitle: string; status: string; color: "cyan" | "purple" }
> = {
  soundscape: {
    title: "Soundscape",
    subtitle: "Music-reactive AI visual generation",
    status: "Active MVP",
    color: "cyan",
  },
  avatar: {
    title: "Avatar Studio",
    subtitle: "MetaDJ avatar generation with VACE identity lock",
    status: "Active MVP",
    color: "purple",
  },
};

const SoundscapeStudio = dynamic(
  () => import("@/components/soundscape").then((mod) => mod.SoundscapeStudio),
  {
    ssr: false,
    loading: () => (
      <div className="flex items-center justify-center min-h-[360px] text-sm text-gray-400">
        Loading Soundscape...
      </div>
    ),
  }
);

const AvatarStudio = dynamic(
  () => import("@/components/AvatarStudio").then((mod) => mod.AvatarStudio),
  {
    ssr: false,
    loading: () => (
      <div className="flex items-center justify-center min-h-[360px] text-sm text-gray-400">
        Loading Avatar Studio...
      </div>
    ),
  }
);

export default function Home() {
  const [focus, setFocus] = useState<ExperienceMode>("soundscape");
  const [soundscapeConnected, setSoundscapeConnected] = useState(false);
  const [avatarConnected, setAvatarConnected] = useState(false);
  const focusedExperience = EXPERIENCES[focus];
  const isFocusedConnected =
    focus === "soundscape" ? soundscapeConnected : avatarConnected;

  return (
    <main className="min-h-screen flex flex-col items-center p-6 md:p-12">
      <header className="text-center mb-10">
        <h1 className="text-4xl md:text-5xl font-semibold font-display mb-3">
          MetaDJ Scope
        </h1>
        <p className="text-gray-400 text-base md:text-lg max-w-md mx-auto">
          Real-time AI video generation. Choose your focus.
        </p>
      </header>

      <section aria-label="Choose an experience" className="w-full max-w-5xl">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {(Object.keys(EXPERIENCES) as ExperienceMode[]).map((mode) => {
            const exp = EXPERIENCES[mode];
            const isCyan = exp.color === "cyan";
            const isActive = focus === mode;
            const accentText = isCyan ? "text-scope-cyan" : "text-scope-purple";
            const activeBorder = isCyan
              ? "border-scope-cyan/70"
              : "border-scope-purple/70";
            const hoverBorder = isCyan
              ? "hover:border-scope-cyan"
              : "hover:border-scope-purple";
            const hoverShadow = isCyan
              ? "hover:shadow-scope-cyan/10"
              : "hover:shadow-scope-purple/10";

            return (
              <button
                key={mode}
                type="button"
                aria-pressed={isActive}
                onClick={() => setFocus(mode)}
                className={`
                  group aspect-[4/3] w-full rounded-2xl border transition-all text-left p-8 md:p-10
                  flex flex-col justify-between
                  ${isActive ? `${activeBorder} bg-scope-elevated/70` : "border-scope-border bg-scope-surface"}
                  ${hoverBorder} hover:bg-scope-elevated/60 hover:shadow-xl ${hoverShadow}
                `}
              >
                <div>
                  <div className="flex items-center justify-between mb-6">
                    <span className={`text-5xl font-display font-bold ${accentText}`}>
                      {mode === "soundscape" ? "S" : "A"}
                    </span>
                    <span className="text-xs uppercase tracking-wider px-3 py-1 rounded-full bg-scope-border text-gray-400 group-hover:bg-scope-elevated">
                      {exp.status}
                    </span>
                  </div>
                  <h2 className="text-2xl md:text-3xl font-semibold font-display mb-2">
                    {exp.title}
                  </h2>
                  <p className="text-gray-400 text-sm md:text-base">
                    {exp.subtitle}
                  </p>
                </div>
                <div className="flex items-center gap-2 text-sm text-gray-500 group-hover:text-gray-300 transition-colors">
                  <span>{isActive ? "Focused" : "Focus this"}</span>
                  <span className="transition-transform group-hover:translate-x-1">→</span>
                </div>
              </button>
            );
          })}
        </div>
      </section>

      <section
        aria-live="polite"
        aria-atomic="true"
        className="w-full max-w-6xl mt-10"
      >
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
          <div>
            <h2 className="text-2xl md:text-3xl font-semibold font-display">
              {focusedExperience.title}
            </h2>
            <p className="text-sm text-gray-400 mt-1">
              {focusedExperience.subtitle}
            </p>
          </div>
          <ConnectionStatus
            isConnected={isFocusedConnected}
            apiUrl={process.env.NEXT_PUBLIC_SCOPE_API_URL || "Not configured"}
          />
        </div>
        {focus === "soundscape" ? (
          <SoundscapeStudio onConnectionChange={setSoundscapeConnected} />
        ) : (
          <AvatarStudio onConnectionChange={setAvatarConnected} />
        )}
      </section>

      <footer className="mt-16 text-center text-gray-500 text-sm">
        <p>Daydream Scope Track Hackathon | Dec 2024 - Jan 2025</p>
      </footer>
    </main>
  );
}
