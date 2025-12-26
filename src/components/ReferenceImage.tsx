"use client";

import { useRef, useState } from "react";
import Image from "next/image";

interface ReferenceImageProps {
  src: string;
  onImageChange: (src: string) => void;
}

export function ReferenceImage({ src, onImageChange }: ReferenceImageProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isLoading, setIsLoading] = useState(false);

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

  return (
    <div className="space-y-3">
      {/* Image Preview */}
      <div className="relative aspect-square bg-black rounded-lg overflow-hidden">
        {isLoading ? (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-gray-400">Loading...</div>
          </div>
        ) : (
          <Image
            src={src}
            alt="MetaDJ Avatar Reference"
            fill
            className="object-cover"
            unoptimized={src.startsWith("data:")}
          />
        )}
      </div>

      {/* Controls */}
      <div className="flex gap-2">
        <button
          onClick={() => fileInputRef.current?.click()}
          className="flex-1 py-2 bg-scope-surface border border-scope-border hover:bg-scope-border rounded text-sm font-medium transition-colors"
        >
          Upload New
        </button>
        <button
          onClick={handleReset}
          className="py-2 px-3 bg-scope-surface border border-scope-border hover:bg-scope-border rounded text-sm transition-colors"
          title="Reset to default MetaDJ avatar"
        >
          ↺
        </button>
      </div>

      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileSelect}
        className="hidden"
      />

      <p className="text-xs text-gray-500">
        VACE uses this image to maintain character consistency
      </p>
    </div>
  );
}
