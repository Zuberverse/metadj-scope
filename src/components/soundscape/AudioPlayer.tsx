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
}

export function AudioPlayer({
  onAudioElement,
  onPlayStateChange,
  disabled = false,
}: AudioPlayerProps) {
  const audioRef = useRef<HTMLAudioElement>(null);
  const micStreamRef = useRef<MediaStream | null>(null);

  const [mode, setMode] = useState<AudioMode>("demo");
  const [audioSrc, setAudioSrc] = useState<string | null>(DEMO_TRACK.path);
  const [fileName, setFileName] = useState<string | null>(DEMO_TRACK.name);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [micError, setMicError] = useState<string | null>(null);
  const [micActive, setMicActive] = useState(false);
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

  // Cleanup mic stream on unmount or mode change
  useEffect(() => {
    return () => {
      if (micStreamRef.current) {
        micStreamRef.current.getTracks().forEach((track) => track.stop());
        micStreamRef.current = null;
      }
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
      if (mode === "mic" && micStreamRef.current) {
        micStreamRef.current.getTracks().forEach((track) => track.stop());
        micStreamRef.current = null;
        setMicActive(false);
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
    if (micStreamRef.current) {
      micStreamRef.current.getTracks().forEach((track) => track.stop());
      micStreamRef.current = null;
    }
    if (audioRef.current) {
      audioRef.current.srcObject = null;
    }
    setMicActive(false);
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

  return (
    <div className="space-y-4">
      {/* Mode Selector */}
      <div className="flex gap-2">
        <button
          onClick={() => handleModeChange("demo")}
          disabled={disabled}
          className={`
            flex-1 px-3 py-2 rounded-lg text-sm font-medium transition-all
            ${mode === "demo"
              ? "bg-scope-purple text-white"
              : "bg-gray-800 text-gray-400 hover:bg-gray-700 hover:text-white"}
            ${disabled ? "opacity-50 cursor-not-allowed" : ""}
          `}
        >
          🎵 Demo
        </button>
        <button
          onClick={() => handleModeChange("upload")}
          disabled={disabled}
          className={`
            flex-1 px-3 py-2 rounded-lg text-sm font-medium transition-all
            ${mode === "upload"
              ? "bg-scope-purple text-white"
              : "bg-gray-800 text-gray-400 hover:bg-gray-700 hover:text-white"}
            ${disabled ? "opacity-50 cursor-not-allowed" : ""}
          `}
        >
          📁 Upload
        </button>
        <button
          onClick={() => handleModeChange("mic")}
          disabled={disabled}
          className={`
            flex-1 px-3 py-2 rounded-lg text-sm font-medium transition-all
            ${mode === "mic"
              ? "bg-scope-cyan text-black"
              : "bg-gray-800 text-gray-400 hover:bg-gray-700 hover:text-white"}
            ${disabled ? "opacity-50 cursor-not-allowed" : ""}
          `}
        >
          🎤 Mic
        </button>
      </div>

      {/* Mode-specific content */}
      {mode === "demo" && (
        <div className="bg-gray-800/50 rounded-lg p-3">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-gradient-brand rounded-lg flex items-center justify-center text-2xl">
              🎧
            </div>
            <div>
              <p className="font-medium text-white">{DEMO_TRACK.name}</p>
              <p className="text-sm text-gray-400">{DEMO_TRACK.artist}</p>
            </div>
          </div>
        </div>
      )}

      {mode === "upload" && (
        <div className="flex flex-col gap-2">
          <label
            htmlFor="audio-upload"
            className={`
              flex items-center justify-center gap-2 px-4 py-3 rounded-lg cursor-pointer
              border-2 border-dashed transition-colors
              ${disabled
                ? "border-gray-700 text-gray-600 cursor-not-allowed"
                : "border-gray-600 hover:border-scope-cyan text-gray-400 hover:text-white"}
            `}
          >
            <span className="text-xl">📁</span>
            <span>{fileName ? "Change Track" : "Select Audio File"}</span>
            <input
              id="audio-upload"
              type="file"
              accept="audio/*"
              onChange={handleFileChange}
              disabled={disabled}
              className="hidden"
            />
          </label>
          <p className="text-xs text-gray-500 px-1">Max file size: {MAX_UPLOAD_MB}MB</p>
          {fileName && (
            <p className="text-sm text-gray-400 truncate px-1">{fileName}</p>
          )}
          {uploadError && (
            <p className="text-red-400 text-xs px-1" role="alert">
              {uploadError}
            </p>
          )}
        </div>
      )}

      {mode === "mic" && (
        <div className="bg-gray-800/50 rounded-lg p-3">
          <div className="flex items-center gap-3">
            <div
              className={`
              w-12 h-12 rounded-lg flex items-center justify-center text-2xl
              ${micActive ? "bg-scope-cyan animate-pulse" : "bg-gray-700"}
            `}
            >
              🎤
            </div>
            <div className="flex-1">
              <p className="font-medium text-white">
                {micActive ? "Listening..." : "Microphone Input"}
              </p>
              <p className="text-sm text-gray-400">
                {micActive ? "Audio analysis active" : "Click play to start"}
              </p>
            </div>
          </div>
          {micError && (
            <p className="text-red-400 text-xs mt-2" role="alert">
              {micError}
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
        <div className="space-y-3">
          {/* Play/Pause Button */}
          <div className="flex justify-center">
            <button
              onClick={isPlaying ? handlePause : handlePlay}
              disabled={disabled}
              className={`
                w-14 h-14 rounded-full flex items-center justify-center text-2xl
                transition-all
                ${disabled
                  ? "bg-gray-700 text-gray-500 cursor-not-allowed"
                  : mode === "mic"
                    ? "bg-scope-cyan hover:bg-scope-cyan/80 text-black"
                    : "bg-scope-purple hover:bg-scope-purple/80 text-white"}
              `}
              aria-label={isPlaying ? "Pause" : "Play"}
            >
              {isPlaying ? "⏸" : "▶"}
            </button>
          </div>

          {/* Progress Bar (not for mic mode) */}
          {mode !== "mic" && audioSrc && (
            <div className="space-y-1">
              <input
                type="range"
                min={0}
                max={duration || 100}
                value={currentTime}
                onChange={handleSeek}
                disabled={disabled}
                className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-scope-cyan"
                aria-label="Seek audio"
              />
              <div className="flex justify-between text-xs text-gray-500">
                <span>{formatTime(currentTime)}</span>
                <span>{formatTime(duration)}</span>
              </div>
            </div>
          )}

          {/* Mic level indicator */}
          {mode === "mic" && micActive && (
            <div className="h-2 bg-gray-700 rounded-lg overflow-hidden">
              <div
                className="h-full bg-scope-cyan rounded-lg animate-pulse"
                style={{ width: "60%" }}
              />
            </div>
          )}
        </div>
      )}
    </div>
  );
}
