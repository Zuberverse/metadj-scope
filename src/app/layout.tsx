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
  title: "MetaDJ Scope - AI Avatar Generator",
  description: "Real-time AI-generated MetaDJ avatar from webcam input using Daydream Scope",
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
