/**
 * Soundscape Page
 * Music-reactive AI visual generation experience
 */

"use client";

import { useState } from "react";
import Link from "next/link";
import { SoundscapeStudio } from "@/components/soundscape";
import { ConnectionStatus } from "@/components/ConnectionStatus";

export default function SoundscapePage() {
  const [isConnected, setIsConnected] = useState(false);

  return (
    <main className="min-h-screen p-4 md:p-8">
      {/* Header */}
      <header className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">MetaDJ Soundscape</h1>
            <p className="text-gray-400 text-sm">
              Music-reactive AI visual generation
            </p>
          </div>
          <div className="flex items-center gap-4">
            {/* Navigation */}
            <Link
              href="/"
              className="text-sm text-gray-400 hover:text-white transition-colors"
            >
              ← Avatar Studio
            </Link>
            <ConnectionStatus
              isConnected={isConnected}
              apiUrl={process.env.NEXT_PUBLIC_SCOPE_API_URL || "Not configured"}
            />
          </div>
        </div>
      </header>

      {/* Main Content */}
      <SoundscapeStudio onConnectionChange={setIsConnected} />

      {/* How It Works */}
      <section className="mt-12 max-w-3xl mx-auto">
        <h2 className="text-xl font-semibold mb-4 text-center">How It Works</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-center">
          <div className="bg-gray-900 rounded-xl p-6">
            <div className="text-4xl mb-3">🎵</div>
            <h3 className="font-medium mb-2">1. Upload Music</h3>
            <p className="text-sm text-gray-400">
              Choose any audio file from your device
            </p>
          </div>
          <div className="bg-gray-900 rounded-xl p-6">
            <div className="text-4xl mb-3">🎨</div>
            <h3 className="font-medium mb-2">2. Choose Theme</h3>
            <p className="text-sm text-gray-400">
              Pick a visual style or create your own
            </p>
          </div>
          <div className="bg-gray-900 rounded-xl p-6">
            <div className="text-4xl mb-3">✨</div>
            <h3 className="font-medium mb-2">3. Experience</h3>
            <p className="text-sm text-gray-400">
              Watch AI generate visuals that react to your music
            </p>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="mt-12 text-center text-gray-500 text-sm">
        <p>MetaDJ Soundscape | Daydream Scope Track Hackathon</p>
        <p className="text-xs mt-1 text-gray-600">
          Audio analysis happens locally in your browser for instant response
        </p>
      </footer>
    </main>
  );
}
