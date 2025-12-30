"use client";

import { useState } from "react";
import dynamic from "next/dynamic";
import { ConnectionStatus } from "@/components/ConnectionStatus";

const SoundscapeStudio = dynamic(
  () => import("@/components/soundscape").then((mod) => mod.SoundscapeStudio),
  {
    ssr: false,
    loading: () => <StudioLoading label="Soundscape" />,
  }
);

const AvatarStudio = dynamic(
  () => import("@/components/AvatarStudio").then((mod) => mod.AvatarStudio),
  {
    ssr: false,
    loading: () => <StudioLoading label="Avatar Studio" />,
  }
);

type FocusMode = "soundscape" | "avatar";

function StudioLoading({ label }: { label: string }) {
  return (
    <div className="flex items-center justify-center min-h-[240px] text-sm text-gray-400">
      Loading {label}...
    </div>
  );
}

const MODE_DETAILS: Record<
  FocusMode,
  { title: string; subtitle: string; status: string; icon: string }
> = {
  soundscape: {
    title: "Soundscape",
    subtitle: "Music-reactive visual generation",
    status: "Active MVP",
    icon: "S",
  },
  avatar: {
    title: "Avatar Studio",
    subtitle: "MetaDJ avatar generation + VACE",
    status: "Active MVP",
    icon: "A",
  },
};

export default function Home() {
  const [focus, setFocus] = useState<FocusMode>("soundscape");
  const [avatarConnected, setAvatarConnected] = useState(false);
  const [soundscapeConnected, setSoundscapeConnected] = useState(false);

  const focusDetails = MODE_DETAILS[focus];

  return (
    <main className="min-h-screen p-4 md:p-10">
      {/* Header */}
      <header className="mb-10">
        <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-3xl md:text-4xl font-semibold font-display">
              MetaDJ Scope
            </h1>
            <p className="text-gray-400 text-sm md:text-base">
              Choose your focus: audio-reactive visuals or the MetaDJ avatar engine.
            </p>
          </div>
          <div className="flex flex-col sm:flex-row gap-3">
            <div>
              <p className="text-xs text-gray-500 mb-1">Avatar Studio</p>
              <ConnectionStatus
                isConnected={avatarConnected}
                apiUrl={process.env.NEXT_PUBLIC_SCOPE_API_URL || "Not configured"}
              />
            </div>
            <div>
              <p className="text-xs text-gray-500 mb-1">Soundscape</p>
              <ConnectionStatus
                isConnected={soundscapeConnected}
                apiUrl={process.env.NEXT_PUBLIC_SCOPE_API_URL || "Not configured"}
              />
            </div>
          </div>
        </div>
      </header>

      {/* Focus Selector */}
      <section aria-label="Choose a focus area" className="mb-12">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {(Object.keys(MODE_DETAILS) as FocusMode[]).map((mode) => {
            const details = MODE_DETAILS[mode];
            const isActive = focus === mode;
            return (
              <button
                key={mode}
                type="button"
                onClick={() => setFocus(mode)}
                aria-pressed={isActive}
                className={`
                  aspect-square w-full rounded-2xl border transition-all text-left p-6 md:p-8
                  ${isActive
                    ? "border-scope-cyan bg-scope-elevated/80 shadow-xl shadow-scope-cyan/10"
                    : "border-scope-border bg-scope-surface hover:border-scope-purple/60 hover:shadow-lg"}
                `}
              >
                <div className="flex items-center justify-between mb-6">
                  <span className="text-4xl">{details.icon}</span>
                  <span
                    className={`text-xs uppercase tracking-wider px-3 py-1 rounded-full ${
                      isActive
                        ? "bg-scope-cyan text-black"
                        : "bg-scope-border text-gray-400"
                    }`}
                  >
                    {details.status}
                  </span>
                </div>
                <h2 className="text-2xl font-semibold font-display mb-2">
                  {details.title}
                </h2>
                <p className="text-gray-400 text-sm md:text-base mb-6">
                  {details.subtitle}
                </p>
                <div className="flex items-center gap-2 text-sm text-gray-300">
                  <span className="inline-flex h-2 w-2 rounded-full bg-scope-purple" />
                  <span>{isActive ? "Focused" : "Click to focus"}</span>
                </div>
              </button>
            );
          })}
        </div>
      </section>

      {/* Focused Experience */}
      <section aria-live="polite">
        <div className="flex items-center justify-between mb-6">
          <div>
            <p className="text-xs text-gray-500 uppercase tracking-widest">
              Focus Mode
            </p>
            <h2 className="text-2xl md:text-3xl font-semibold font-display">
              {focusDetails.title}
            </h2>
          </div>
          <p className="text-sm text-gray-400">{focusDetails.subtitle}</p>
        </div>

        {focus === "soundscape" ? (
          <SoundscapeStudio onConnectionChange={setSoundscapeConnected} />
        ) : (
          <AvatarStudio onConnectionChange={setAvatarConnected} />
        )}
      </section>

      {/* Footer */}
      <footer className="mt-12 text-center text-gray-500 text-sm">
        <p>Daydream Scope Track Hackathon | Dec 2024 - Jan 2025</p>
      </footer>
    </main>
  );
}
