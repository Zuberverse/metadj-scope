import type { Metadata } from "next";
import { Cinzel, JetBrains_Mono, Poppins } from "next/font/google";
import "./globals.css";

const poppins = Poppins({
  variable: "--font-poppins",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

const cinzel = Cinzel({
  variable: "--font-cinzel",
  subsets: ["latin"],
  weight: ["400", "600", "700"],
});

const jetbrainsMono = JetBrains_Mono({
  variable: "--font-jetbrains-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "MetaDJ Scope - Real-Time AI Video Generation",
  description: "Transform audio into flowing AI visuals and generate avatar transformations in real-time. Built for the Daydream Scope hackathon.",
  keywords: ["AI", "video generation", "StreamDiffusion", "audio reactive", "Daydream Scope", "MetaDJ"],
  authors: [{ name: "MetaDJ", url: "https://metadj.ai" }],
  openGraph: {
    title: "MetaDJ Scope - Real-Time AI Video Generation",
    description: "Transform audio into flowing AI visuals in real-time.",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${poppins.variable} ${cinzel.variable} ${jetbrainsMono.variable} antialiased bg-scope-bg text-white min-h-screen`}
      >
        {children}
      </body>
    </html>
  );
}
