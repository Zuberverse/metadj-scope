import type { Config } from "tailwindcss";

export default {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        // MetaDJ brand colors (OKLCH-based)
        background: "var(--background)",
        foreground: "var(--foreground)",
        // Scope-inspired dark theme
        scope: {
          bg: "#0a0a0a",
          surface: "#1a1a1a",
          border: "#2a2a2a",
          accent: "#7c3aed", // Purple accent
          success: "#22c55e",
          warning: "#eab308",
          error: "#ef4444",
        },
      },
    },
  },
  plugins: [],
} satisfies Config;
