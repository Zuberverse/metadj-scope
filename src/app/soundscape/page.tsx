/**
 * Soundscape Page
 * Video-first immersive layout - AI visual generation as the HERO
 */

"use client";

import { useState } from "react";
import Link from "next/link";
import { SoundscapeStudio } from "@/components/soundscape";
import { ConnectionStatus } from "@/components/ConnectionStatus";

export default function SoundscapePage() {
  const [isConnected, setIsConnected] = useState(false);

  return (
    <div className="h-screen flex flex-col bg-scope-bg overflow-hidden">
      {/* Minimal Header - Fixed */}
      <header className="flex-none flex items-center justify-between px-4 py-3 border-b border-white/5 bg-scope-bg/80 backdrop-blur-sm z-50">
        <div className="flex items-center gap-4">
          <Link
            href="/"
            className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors text-sm"
          >
            <span className="text-lg">←</span>
            <span className="hidden sm:inline">Back</span>
          </Link>
          <div className="h-4 w-px bg-white/10" />
          <h1 className="text-lg font-semibold">Soundscape</h1>
        </div>

        <ConnectionStatus
          isConnected={isConnected}
          apiUrl={process.env.NEXT_PUBLIC_SCOPE_API_URL || "Not configured"}
        />
      </header>

      {/* Main Content - Fill remaining height */}
      <main className="flex-1 min-h-0">
        <SoundscapeStudio onConnectionChange={setIsConnected} />
      </main>
    </div>
  );
}
