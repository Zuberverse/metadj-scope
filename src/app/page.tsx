"use client";

import { useState } from "react";
import Link from "next/link";
import { AvatarStudio } from "@/components/AvatarStudio";
import { ConnectionStatus } from "@/components/ConnectionStatus";

export default function Home() {
  const [isConnected, setIsConnected] = useState(false);

  return (
    <main className="min-h-screen p-4 md:p-8">
      {/* Header */}
      <header className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">MetaDJ Scope</h1>
            <p className="text-gray-400 text-sm">AI Avatar Generator</p>
          </div>
          <div className="flex items-center gap-4">
            {/* Navigation */}
            <Link
              href="/soundscape"
              className="text-sm text-gray-400 hover:text-white transition-colors"
            >
              Soundscape →
            </Link>
            <ConnectionStatus
              isConnected={isConnected}
              apiUrl={process.env.NEXT_PUBLIC_SCOPE_API_URL || "Not configured"}
            />
          </div>
        </div>
      </header>

      {/* Main Content */}
      <AvatarStudio onConnectionChange={setIsConnected} />

      {/* Footer */}
      <footer className="mt-8 text-center text-gray-500 text-sm">
        <p>Daydream Scope Track Hackathon | Dec 2024 - Jan 2025</p>
      </footer>
    </main>
  );
}
