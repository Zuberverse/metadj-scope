"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";

interface ReferenceImageProps {
  src: string;
  onImageChange: (src: string) => void;
}

export function ReferenceImage({ src, onImageChange }: ReferenceImageProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [assetPath, setAssetPath] = useState(
    src.startsWith("/assets/") ? src : ""
  );

  useEffect(() => {
    if (src.startsWith("/assets/")) {
      setAssetPath(src);
    }
  }, [src]);

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsLoading(true);
    try {
      // Convert to base64 for preview (and later API upload)
      const reader = new FileReader();
      reader.onload = (event) => {
        const base64 = event.target?.result as string;
        onImageChange(base64);
        setIsLoading(false);
      };
      reader.onerror = () => {
        console.error("[ReferenceImage] Failed to read file");
        setIsLoading(false);
      };
      reader.readAsDataURL(file);
    } catch (err) {
      console.error("[ReferenceImage] Error:", err);
      setIsLoading(false);
    }
  };

  const handleReset = () => {
    onImageChange("/metadj-avatar-reference.png");
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleApplyAssetPath = () => {
    if (!assetPath.trim()) return;
    onImageChange(assetPath.trim());
  };

  return (
    <div className="space-y-6">
      {/* Image Preview */}
      <div className="relative aspect-square glass rounded-2xl overflow-hidden group border border-white/5 shadow-inner">
        {/* Deep Inner Shadow */}
        <div className="absolute inset-0 z-10 pointer-events-none shadow-[inset_0_0_60px_rgba(0,0,0,0.8)]" />

        {isLoading ? (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 bg-black/40 backdrop-blur-md">
            <div className="w-12 h-12 border-2 border-scope-magenta/20 border-t-scope-magenta rounded-full animate-spin" />
            <div className="text-[10px] font-black uppercase tracking-[0.4em] text-white/40 animate-pulse">Processing...</div>
          </div>
        ) : (
          <Image
            src={src}
            alt="MetaDJ Avatar Reference"
            fill
            className="object-cover transition-transform duration-700 group-hover:scale-110"
            unoptimized={src.startsWith("data:")}
          />
        )}
      </div>

      {/* Controls */}
      <div className="flex gap-3">
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          aria-label="Upload new reference image"
          className="flex-1 py-4 glass bg-white/5 hover:bg-scope-magenta/20 border-white/5 hover:border-scope-magenta/30 rounded-2xl text-[10px] font-black uppercase tracking-[0.3em] text-white/40 hover:text-white transition-all duration-500 hover:scale-[1.02] active:scale-95 shadow-xl"
        >
          Inject Image
        </button>
        <button
          type="button"
          onClick={handleReset}
          aria-label="Reset to default MetaDJ avatar"
          className="aspect-square w-12 flex items-center justify-center glass bg-white/5 hover:bg-white/10 border-white/5 rounded-2xl text-lg text-white/40 hover:text-white transition-all duration-500 hover:rotate-180"
        >
          ↺
        </button>
      </div>

      <div className="space-y-3 pt-2">
        <label htmlFor="scope-asset-path" className="text-[10px] font-black uppercase tracking-[0.4em] text-white/20 px-1">
          Neural Asset Path
        </label>
        <div className="flex gap-3">
          <input
            id="scope-asset-path"
            type="text"
            value={assetPath}
            onChange={(event) => setAssetPath(event.target.value)}
            placeholder="/assets/metadj-studio.png"
            className="flex-1 px-4 py-3 glass bg-black/40 border border-white/5 rounded-2xl text-[10px] text-white placeholder:text-white/10 focus:outline-none focus:border-scope-magenta/40 transition-all duration-300 font-mono"
          />
          <button
            type="button"
            onClick={handleApplyAssetPath}
            className="px-6 py-3 glass-radiant bg-scope-magenta/20 hover:bg-scope-magenta text-white/80 hover:text-white text-[10px] font-black uppercase tracking-widest rounded-2xl transition-all duration-500 hover:scale-105 active:scale-95"
          >
            Bind
          </button>
        </div>
      </div>

      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileSelect}
        aria-label="Select reference image file"
        className="hidden"
      />

      <div className="px-1 pt-2">
        <p className="text-[9px] font-bold text-white/10 uppercase tracking-widest leading-relaxed">
          <span className="text-scope-magenta/40">NOTE:</span> VACE requires server-side asset mapping. Local uploads are preview-only in current session.
        </p>
      </div>
    </div>
  );
}
