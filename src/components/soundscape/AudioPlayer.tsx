/**
 * Audio Player Component
 * MVP: Demo track playback only with infinite loop
 * Future: File upload and mic input support
 */

"use client";

import { useRef, useState, useCallback, useEffect, type ChangeEvent } from "react";

// Demo track path (in public folder)
const DEMO_TRACK = {
  path: "/audio/metaversal-odyssey.mp3",
  name: "Metaversal Odyssey",
  artist: "MetaDJ",
};

interface AudioPlayerProps {
  onAudioElement: (element: HTMLAudioElement | null) => void;
  onPlayStateChange: (isPlaying: boolean) => void;
  disabled?: boolean;
  compact?: boolean;
}

export function AudioPlayer({
  onAudioElement,
  onPlayStateChange,
  disabled = false,
  compact = false,
}: AudioPlayerProps) {
  const audioRef = useRef<HTMLAudioElement>(null);

  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);

  // Connect audio element on mount
  useEffect(() => {
    if (audioRef.current) {
      const timer = setTimeout(() => {
        if (audioRef.current) {
          onAudioElement(audioRef.current);
        }
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [onAudioElement]);

  const handlePlay = useCallback(() => {
    if (!audioRef.current) return;
    audioRef.current.play();
    setIsPlaying(true);
    onPlayStateChange(true);
  }, [onPlayStateChange]);

  const handlePause = useCallback(() => {
    if (!audioRef.current) return;
    audioRef.current.pause();
    setIsPlaying(false);
    onPlayStateChange(false);
  }, [onPlayStateChange]);

  const handleTimeUpdate = useCallback(() => {
    if (audioRef.current) {
      setCurrentTime(audioRef.current.currentTime);
    }
  }, []);

  const handleLoadedMetadata = useCallback(() => {
    if (audioRef.current) {
      setDuration(audioRef.current.duration);
    }
  }, []);

  const handleSeek = useCallback(
    (e: ChangeEvent<HTMLInputElement>) => {
      const time = parseFloat(e.target.value);
      if (audioRef.current) {
        audioRef.current.currentTime = time;
        setCurrentTime(time);
      }
    },
    []
  );

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  // Compact mode for dock
  if (compact) {
    return (
      <div className="flex items-center gap-3">
        {/* Play/Pause */}
        <button
          type="button"
          onClick={isPlaying ? handlePause : handlePlay}
          disabled={disabled}
          className={`
            w-9 h-9 rounded-full flex items-center justify-center text-sm transition-all duration-300 border
            ${isPlaying
              ? "glass bg-scope-purple/30 text-white border-scope-purple/50 shadow-[0_0_15px_rgba(139,92,246,0.3)]"
              : "glass bg-scope-purple/20 text-white border-scope-purple/40 hover:bg-scope-purple/30"}
          `}
        >
          {isPlaying ? "⏸" : "▶"}
        </button>

        {/* Track info */}
        <div className="flex-1 min-w-0">
          <p className="text-[11px] text-white/80 truncate font-medium">{DEMO_TRACK.name}</p>
          {duration > 0 && (
            <p className="text-[10px] text-white/30 font-mono">{formatTime(currentTime)} / {formatTime(duration)}</p>
          )}
        </div>

        {/* Loop indicator */}
        <div className="px-2 py-1 glass bg-scope-cyan/10 rounded text-[9px] text-scope-cyan/70 font-medium">
          ∞ Loop
        </div>

        {/* Hidden audio element with loop */}
        <audio
          ref={audioRef}
          src={DEMO_TRACK.path}
          onTimeUpdate={handleTimeUpdate}
          onLoadedMetadata={handleLoadedMetadata}
          loop
          preload="metadata"
        />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Demo Track Display */}
      <div className="glass rounded-2xl p-5 border-white/5 relative overflow-hidden group">
        <div className="absolute inset-0 bg-scope-purple/10 opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none" />
        <div className="flex items-center gap-4 relative z-10">
          <div className="w-14 h-14 bg-gradient-brand rounded-2xl flex items-center justify-center text-3xl shadow-lg group-hover:scale-110 transition-transform duration-500">
            🎧
          </div>
          <div className="flex flex-col gap-1 flex-1">
            <p className="font-bold text-white uppercase tracking-tighter text-lg">{DEMO_TRACK.name}</p>
            <p className="text-[10px] font-black text-white/40 uppercase tracking-widest">{DEMO_TRACK.artist}</p>
          </div>
          <div className="px-3 py-1.5 glass bg-scope-cyan/10 rounded-lg text-[10px] text-scope-cyan/70 font-bold uppercase tracking-wider">
            ∞ Loop
          </div>
        </div>
      </div>

      {/* Hidden Audio Element with loop */}
      <audio
        ref={audioRef}
        src={DEMO_TRACK.path}
        onTimeUpdate={handleTimeUpdate}
        onLoadedMetadata={handleLoadedMetadata}
        loop
        preload="metadata"
      />

      {/* Playback Controls */}
      <div className="space-y-6 pt-2">
        {/* Play/Pause Button */}
        <div className="flex justify-center">
          <button
            type="button"
            onClick={isPlaying ? handlePause : handlePlay}
            disabled={disabled}
            className={`
              w-16 h-16 rounded-full flex items-center justify-center text-3xl
              transition-all duration-500 shadow-2xl relative group
              ${disabled
                ? "bg-white/5 text-white/10 cursor-not-allowed"
                : "bg-scope-purple hover:bg-white text-white hover:text-scope-purple hover:shadow-[0_0_40px_rgba(139,92,246,0.4)]"}
              hover:scale-110 active:scale-90
            `}
            aria-label={isPlaying ? "Pause" : "Play"}
          >
            {/* Pulsing ring when active */}
            {isPlaying && (
              <div className="absolute inset-0 rounded-full border-2 border-current animate-ping opacity-20 scale-125" />
            )}
            {isPlaying ? "⏸" : "▶"}
          </button>
        </div>

        {/* Progress Bar */}
        <div className="space-y-3 px-2">
          <div className="relative h-2 group">
            <input
              type="range"
              min={0}
              max={duration || 100}
              value={currentTime}
              onChange={handleSeek}
              disabled={disabled}
              className="absolute inset-0 w-full h-full bg-white/5 rounded-full appearance-none cursor-pointer accent-scope-cyan z-20 opacity-0"
              aria-label="Seek audio"
            />
            {/* Visual Progress Track */}
            <div className="absolute inset-0 bg-white/5 rounded-full z-0 overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-scope-purple to-scope-cyan rounded-full transition-all duration-100"
                style={{ width: `${(currentTime / (duration || 1)) * 100}%` }}
              />
            </div>
            {/* Knob mimic */}
            <div
              className="absolute top-1/2 -translate-y-1/2 w-4 h-4 bg-white rounded-full shadow-lg z-10 transition-all duration-100 border-2 border-scope-cyan pointer-events-none group-hover:scale-125"
              style={{ left: `calc(${(currentTime / (duration || 1)) * 100}% - 8px)` }}
            />
          </div>
          <div className="flex justify-between text-[10px] font-black uppercase tracking-[0.3em] text-white/20">
            <span>{formatTime(currentTime)}</span>
            <span>{formatTime(duration)}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
