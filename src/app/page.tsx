/**
 * MetaDJ Scope - Navigation Hub
 * Clean navigation to immersive experiences
 */

import Link from "next/link";

type ExperienceMode = "soundscape" | "avatar";

const EXPERIENCES: Record<
  ExperienceMode,
  { title: string; subtitle: string; status: string; color: "cyan" | "purple"; href: string }
> = {
  soundscape: {
    title: "Soundscape",
    subtitle: "Music-reactive AI visual generation",
    status: "Active MVP",
    color: "cyan",
    href: "/soundscape",
  },
  avatar: {
    title: "Avatar Studio",
    subtitle: "MetaDJ avatar generation with VACE identity lock",
    status: "Active MVP",
    color: "purple",
    href: "/avatar",
  },
};

export default function Home() {
  return (
    <main className="min-h-screen flex flex-col items-center justify-center p-4">
      {/* Header */}
      <header className="text-center mb-12">
        <h1 className="text-4xl md:text-5xl font-bold font-display mb-3 tracking-tight">
          MetaDJ Scope
        </h1>
        <p className="text-gray-400 text-base md:text-lg">
          Real-time AI video generation
        </p>
      </header>

      {/* Experience Cards - Navigation Only */}
      <section aria-label="Choose an experience" className="w-full max-w-4xl">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {(Object.keys(EXPERIENCES) as ExperienceMode[]).map((mode) => {
            const exp = EXPERIENCES[mode];
            const isCyan = exp.color === "cyan";
            const accentText = isCyan ? "text-scope-cyan" : "text-scope-purple";
            const hoverBorder = isCyan
              ? "hover:border-scope-cyan/60"
              : "hover:border-scope-purple/60";
            const hoverGlow = isCyan
              ? "hover:shadow-[0_0_40px_rgba(6,182,212,0.15)]"
              : "hover:shadow-[0_0_40px_rgba(168,85,247,0.15)]";

            return (
              <Link
                key={mode}
                href={exp.href}
                className={`
                  group relative aspect-[16/10] w-full rounded-2xl border border-white/10
                  bg-scope-surface/50 backdrop-blur-sm
                  transition-all duration-300 text-left p-6 md:p-8
                  flex flex-col justify-between overflow-hidden
                  ${hoverBorder} ${hoverGlow} hover:bg-scope-elevated/40
                `}
              >
                {/* Background accent */}
                <div className={`absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 ${isCyan ? "bg-gradient-to-br from-scope-cyan/5 to-transparent" : "bg-gradient-to-br from-scope-purple/5 to-transparent"}`} />

                <div className="relative z-10">
                  <div className="flex items-center justify-between mb-4">
                    <span className={`text-4xl md:text-5xl font-display font-bold ${accentText}`}>
                      {mode === "soundscape" ? "S" : "A"}
                    </span>
                    <span className="text-[10px] uppercase tracking-wider px-3 py-1 rounded-full bg-white/5 text-gray-400 border border-white/5">
                      {exp.status}
                    </span>
                  </div>
                  <h2 className="text-xl md:text-2xl font-semibold font-display mb-1">
                    {exp.title}
                  </h2>
                  <p className="text-gray-400 text-sm">
                    {exp.subtitle}
                  </p>
                </div>
                <div className="relative z-10 flex items-center gap-2 text-sm text-gray-500 group-hover:text-white/70 transition-colors">
                  <span>Launch</span>
                  <span className="transition-transform group-hover:translate-x-1">→</span>
                </div>
              </Link>
            );
          })}
        </div>
      </section>

      {/* Footer */}
      <footer className="mt-12 text-center text-gray-600 text-xs">
        <p>Daydream Scope Track Hackathon</p>
      </footer>
    </main>
  );
}
