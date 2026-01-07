/**
 * Audio Player Component
 * Handles demo playback, file upload, and mic input for Soundscape
 */

"use client";

import { useRef, useState, useCallback, useEffect, ChangeEvent } from "react";

// Demo track path (in public folder)
const DEMO_TRACK = {
  path: "/audio/metaversal-odyssey.mp3",
  name: "Metaversal Odyssey",
  artist: "MetaDJ",
};

const MAX_UPLOAD_MB = 50;
const MAX_UPLOAD_BYTES = MAX_UPLOAD_MB * 1024 * 1024;

type AudioMode = "demo" | "upload" | "mic";

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
  const micStreamRef = useRef<MediaStream | null>(null);
  const micAnalyserRef = useRef<AnalyserNode | null>(null);
  const micAudioContextRef = useRef<AudioContext | null>(null);
  const micLevelIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const [mode, setMode] = useState<AudioMode>("demo");
  const [audioSrc, setAudioSrc] = useState<string | null>(DEMO_TRACK.path);
  const [fileName, setFileName] = useState<string | null>(DEMO_TRACK.name);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [micError, setMicError] = useState<string | null>(null);
  const [micActive, setMicActive] = useState(false);
  const [micLevel, setMicLevel] = useState(0);
  const [uploadError, setUploadError] = useState<string | null>(null);

  // Connect audio element when source changes
  useEffect(() => {
    if (mode !== "mic" && audioRef.current && audioSrc) {
      // Small delay to ensure audio element is ready
      const timer = setTimeout(() => {
        if (audioRef.current) {
          onAudioElement(audioRef.current);
        }
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [audioSrc, mode, onAudioElement]);

  // Cleanup mic stream and analyser on unmount or mode change
  useEffect(() => {
    return () => {
      // Clean up level monitoring interval
      if (micLevelIntervalRef.current) {
        clearInterval(micLevelIntervalRef.current);
        micLevelIntervalRef.current = null;
      }
      // Clean up mic stream
      if (micStreamRef.current) {
        micStreamRef.current.getTracks().forEach((track) => track.stop());
        micStreamRef.current = null;
      }
      // Clean up audio context
      if (micAudioContextRef.current) {
        micAudioContextRef.current.close();
        micAudioContextRef.current = null;
      }
      micAnalyserRef.current = null;
    };
  }, []);

  // Revoke blob URLs on cleanup or when switching files
  useEffect(() => {
    return () => {
      if (audioSrc?.startsWith("blob:")) {
        URL.revokeObjectURL(audioSrc);
      }
    };
  }, [audioSrc]);

  const handleModeChange = useCallback(
    (newMode: AudioMode) => {
      // Stop current playback
      if (audioRef.current) {
        audioRef.current.pause();
      }
      setIsPlaying(false);
      onPlayStateChange(false);
      setMicError(null);
      setUploadError(null);

      // Stop mic if switching away
      if (mode === "mic") {
        // Clean up level monitoring
        if (micLevelIntervalRef.current) {
          clearInterval(micLevelIntervalRef.current);
          micLevelIntervalRef.current = null;
        }
        if (micStreamRef.current) {
          micStreamRef.current.getTracks().forEach((track) => track.stop());
          micStreamRef.current = null;
        }
        if (micAudioContextRef.current) {
          micAudioContextRef.current.close();
          micAudioContextRef.current = null;
        }
        micAnalyserRef.current = null;
        setMicActive(false);
        setMicLevel(0);
      }

      setMode(newMode);

      // Set up new mode
      if (newMode === "demo") {
        setAudioSrc(DEMO_TRACK.path);
        setFileName(DEMO_TRACK.name);
        setCurrentTime(0);
      } else if (newMode === "upload") {
        setAudioSrc(null);
        setFileName(null);
        setCurrentTime(0);
        setDuration(0);
      } else if (newMode === "mic") {
        setAudioSrc(null);
        setFileName("Microphone Input");
        setCurrentTime(0);
        setDuration(0);
      }
    },
    [mode, onPlayStateChange]
  );

  const handleFileChange = useCallback(
    (event: ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0];
      if (!file) return;

      setUploadError(null);

      if (!file.type.startsWith("audio/")) {
        setUploadError("Invalid file type. Please select an audio file.");
        event.target.value = "";
        setAudioSrc(null);
        setFileName(null);
        setIsPlaying(false);
        setCurrentTime(0);
        onPlayStateChange(false);
        return;
      }

      if (file.size > MAX_UPLOAD_BYTES) {
        setUploadError(`File too large. Max ${MAX_UPLOAD_MB}MB.`);
        event.target.value = "";
        setAudioSrc(null);
        setFileName(null);
        setIsPlaying(false);
        setCurrentTime(0);
        onPlayStateChange(false);
        return;
      }

      const url = URL.createObjectURL(file);
      setAudioSrc(url);
      setFileName(file.name);
      setIsPlaying(false);
      setCurrentTime(0);
      onPlayStateChange(false);
    },
    [onPlayStateChange]
  );

  const startMic = useCallback(async () => {
    try {
      setMicError(null);
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        },
      });

      micStreamRef.current = stream;
      setMicActive(true);

      // Set up audio analyser for level monitoring
      const audioContext = new AudioContext();
      micAudioContextRef.current = audioContext;
      const analyser = audioContext.createAnalyser();
      analyser.fftSize = 256;
      micAnalyserRef.current = analyser;

      const source = audioContext.createMediaStreamSource(stream);
      source.connect(analyser);

      // Start level monitoring at ~15fps
      const dataArray = new Uint8Array(analyser.frequencyBinCount);
      micLevelIntervalRef.current = setInterval(() => {
        if (micAnalyserRef.current) {
          micAnalyserRef.current.getByteFrequencyData(dataArray);
          // Calculate RMS-like level from frequency data
          let sum = 0;
          for (let i = 0; i < dataArray.length; i++) {
            sum += dataArray[i];
          }
          const average = sum / dataArray.length;
          // Normalize to 0-100 range with some amplification
          const level = Math.min(100, (average / 128) * 100);
          setMicLevel(level);
        }
      }, 66); // ~15fps

      // Create audio element for mic stream
      if (audioRef.current) {
        audioRef.current.srcObject = stream;
        audioRef.current.muted = true; // Prevent feedback
        onAudioElement(audioRef.current);
        setIsPlaying(true);
        onPlayStateChange(true);
      }
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Failed to access microphone";
      setMicError(message);
      console.error("[AudioPlayer] Mic error:", error);
    }
  }, [onAudioElement, onPlayStateChange]);

  const stopMic = useCallback(() => {
    // Clean up level monitoring
    if (micLevelIntervalRef.current) {
      clearInterval(micLevelIntervalRef.current);
      micLevelIntervalRef.current = null;
    }
    if (micStreamRef.current) {
      micStreamRef.current.getTracks().forEach((track) => track.stop());
      micStreamRef.current = null;
    }
    if (micAudioContextRef.current) {
      micAudioContextRef.current.close();
      micAudioContextRef.current = null;
    }
    micAnalyserRef.current = null;
    if (audioRef.current) {
      audioRef.current.srcObject = null;
    }
    setMicActive(false);
    setMicLevel(0);
    setIsPlaying(false);
    onPlayStateChange(false);
  }, [onPlayStateChange]);

  const handlePlay = useCallback(() => {
    if (mode === "mic") {
      startMic();
      return;
    }
    if (!audioRef.current) return;
    audioRef.current.play();
    setIsPlaying(true);
    onPlayStateChange(true);
  }, [mode, startMic, onPlayStateChange]);

  const handlePause = useCallback(() => {
    if (mode === "mic") {
      stopMic();
      return;
    }
    if (!audioRef.current) return;
    audioRef.current.pause();
    setIsPlaying(false);
    onPlayStateChange(false);
  }, [mode, stopMic, onPlayStateChange]);

  const handleTimeUpdate = useCallback(() => {
    if (audioRef.current && mode !== "mic") {
      setCurrentTime(audioRef.current.currentTime);
    }
  }, [mode]);

  const handleLoadedMetadata = useCallback(() => {
    if (audioRef.current && mode !== "mic") {
      setDuration(audioRef.current.duration);
    }
  }, [mode]);

  const handleEnded = useCallback(() => {
    setIsPlaying(false);
    onPlayStateChange(false);
  }, [onPlayStateChange]);

  const handleSeek = useCallback(
    (e: ChangeEvent<HTMLInputElement>) => {
      if (mode === "mic") return;
      const time = parseFloat(e.target.value);
      if (audioRef.current) {
        audioRef.current.currentTime = time;
        setCurrentTime(time);
      }
    },
    [mode]
  );

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  const canPlay =
    (mode === "demo" || mode === "mic" || (mode === "upload" && audioSrc)) && !uploadError;

  // Compact mode for dock
  if (compact) {
    return (
      <div className="flex items-center gap-3">
        {/* Mode buttons */}
        <div className="flex gap-1">
          {(["demo", "upload", "mic"] as AudioMode[]).map((m) => (
            <button
              key={m}
              type="button"
              onClick={() => handleModeChange(m)}
              aria-pressed={mode === m}
              aria-label={`Audio mode: ${m}`}
              disabled={disabled}
              className={`
                px-2.5 py-1.5 rounded-lg text-[9px] font-bold uppercase transition-all duration-300 border
                ${mode === m
                  ? "glass bg-scope-cyan/20 text-scope-cyan border-scope-cyan/40 shadow-[0_0_10px_rgba(6,182,212,0.2)]"
                  : "glass bg-white/5 text-white/40 border-white/10 hover:bg-white/10 hover:border-scope-cyan/30"}
              `}
            >
              {m === "demo" ? "🎵" : m === "upload" ? "📁" : "🎤"}
            </button>
          ))}
        </div>

        {/* Play/Pause */}
        {canPlay && (
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
        )}

        {/* Track info */}
        <div className="flex-1 min-w-0">
          <p className="text-[11px] text-white/80 truncate font-medium">{fileName || "No audio"}</p>
          {mode !== "mic" && duration > 0 && (
            <p className="text-[10px] text-white/30 font-mono">{formatTime(currentTime)} / {formatTime(duration)}</p>
          )}
          {mode === "mic" && micActive && (
            <div className="mt-1 h-1 glass bg-white/5 rounded-full overflow-hidden">
              <div
                className="h-full bg-scope-cyan rounded-full transition-all duration-75"
                style={{ width: `${micLevel}%` }}
              />
            </div>
          )}
        </div>

        {/* Hidden audio element */}
        <audio
          ref={audioRef}
          src={mode !== "mic" ? audioSrc || undefined : undefined}
          onTimeUpdate={handleTimeUpdate}
          onLoadedMetadata={handleLoadedMetadata}
          onEnded={handleEnded}
          preload="metadata"
        />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Mode Selector */}
      <div className="flex gap-3">
        {(["demo", "upload", "mic"] as AudioMode[]).map((m) => {
          const isSelected = mode === m;
          const isMic = m === "mic";
          const accentColor = isMic ? "scope-cyan" : "scope-purple";

          return (
            <button
              key={m}
              type="button"
              onClick={() => handleModeChange(m)}
              aria-pressed={isSelected}
              disabled={disabled}
              className={`
                flex-1 px-4 py-3 rounded-2xl text-[10px] font-black uppercase tracking-[0.3em] transition-all duration-500
                ${isSelected
                  ? `bg-${accentColor} text-${isMic ? 'black' : 'white'} shadow-[0_0_20px_rgba(139,92,246,0.3)]`
                  : "bg-white/5 text-white/40 hover:bg-white/10 hover:text-white border border-white/5"}
                ${disabled ? "opacity-30 cursor-not-allowed" : "hover:scale-105 active:scale-95"}
              `}
            >
              {m === "demo" && "🎵 Demo"}
              {m === "upload" && "📁 Upload"}
              {m === "mic" && "🎤 Mic"}
            </button>
          );
        })}
      </div>

      {/* Mode-specific content */}
      {mode === "demo" && (
        <div className="glass rounded-2xl p-5 border-white/5 relative overflow-hidden group">
          <div className="absolute inset-0 bg-scope-purple/10 opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none" />
          <div className="flex items-center gap-4 relative z-10">
            <div className="w-14 h-14 bg-gradient-brand rounded-2xl flex items-center justify-center text-3xl shadow-lg group-hover:scale-110 transition-transform duration-500">
              🎧
            </div>
            <div className="flex flex-col gap-1">
              <p className="font-bold text-white uppercase tracking-tighter text-lg">{DEMO_TRACK.name}</p>
              <p className="text-[10px] font-black text-white/40 uppercase tracking-widest">{DEMO_TRACK.artist}</p>
            </div>
          </div>
        </div>
      )}

      {mode === "upload" && (
        <div className="flex flex-col gap-3">
          <label
            htmlFor="audio-upload"
            className={`
              flex items-center justify-center gap-3 px-6 py-5 rounded-2xl cursor-pointer
              border border-dashed transition-all duration-500 glass
              ${disabled
                ? "border-white/5 text-white/20 cursor-not-allowed"
                : "border-white/20 hover:border-scope-cyan/50 text-white/40 hover:text-white hover:bg-white/5"}
            `}
          >
            <span className="text-2xl">📁</span>
            <span className="text-[10px] font-black uppercase tracking-[0.3em]">{fileName ? "Change Local Track" : "Inject Audio File"}</span>
            <input
              id="audio-upload"
              type="file"
              accept="audio/*"
              onChange={handleFileChange}
              disabled={disabled}
              className="hidden"
            />
          </label>
          <div className="flex justify-between items-center px-2">
            <p className="text-[9px] font-black uppercase tracking-widest text-white/20">Protocol: MAX {MAX_UPLOAD_MB}MB</p>
            {fileName && (
              <p className="text-[10px] font-bold text-scope-cyan truncate max-w-[60%]">{fileName}</p>
            )}
          </div>
          {uploadError && (
            <p className="text-red-400 text-[10px] font-black uppercase tracking-widest px-2 mt-1" role="alert">
              Sync Error: {uploadError}
            </p>
          )}
        </div>
      )}

      {mode === "mic" && (
        <div className="glass rounded-2xl p-5 border-white/5 relative overflow-hidden group">
          <div className="absolute inset-0 bg-scope-cyan/10 opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none" />
          <div className="flex items-center gap-4 relative z-10">
            <div
              className={`
              w-14 h-14 rounded-2xl flex items-center justify-center text-3xl transition-all duration-500
              ${micActive ? "bg-scope-cyan text-black shadow-[0_0_30px_rgba(6,182,212,0.4)]" : "bg-white/5 text-white/20"}
            `}
            >
              🎤
            </div>
            <div className="flex-1 flex flex-col gap-1">
              <p className="font-bold text-white uppercase tracking-tighter text-lg">
                {micActive ? "Neural Input Active" : "Microphone Stream"}
              </p>
              <p className="text-[10px] font-black text-white/40 uppercase tracking-widest">
                {micActive ? "Encoding real-time spectral data" : "Awaiting protocol initiation"}
              </p>
            </div>
          </div>
          {micError && (
            <p className="text-red-400 text-[10px] font-black uppercase tracking-widest mt-4 px-2" role="alert">
              Mic Error: {micError}
            </p>
          )}
        </div>
      )}

      {/* Hidden Audio Element */}
      <audio
        ref={audioRef}
        src={mode !== "mic" ? audioSrc || undefined : undefined}
        onTimeUpdate={handleTimeUpdate}
        onLoadedMetadata={handleLoadedMetadata}
        onEnded={handleEnded}
        preload="metadata"
      />

      {/* Playback Controls */}
      {canPlay && (
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
                  : mode === "mic"
                    ? "bg-scope-cyan hover:bg-white text-black hover:shadow-[0_0_40px_rgba(6,182,212,0.4)]"
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

          {/* Progress Bar (not for mic mode) */}
          {mode !== "mic" && audioSrc && (
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
          )}

          {/* Mic level indicator */}
          {mode === "mic" && micActive && (
            <div className="px-2">
              <div className="h-1.5 bg-white/5 rounded-full overflow-hidden border border-white/5">
                <div
                  className="h-full bg-gradient-to-r from-scope-cyan via-scope-magenta to-scope-purple rounded-full transition-all duration-75 shadow-[0_0_15px_rgba(6,182,212,0.5)]"
                  style={{ width: `${micLevel}%` }}
                />
              </div>
              <div className="flex justify-between mt-2 text-[9px] font-black uppercase tracking-widest text-white/10">
                <span>Min</span>
                <span>Spectral Flux</span>
                <span>Max</span>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
