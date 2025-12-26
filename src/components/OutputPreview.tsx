"use client";

interface OutputPreviewProps {
  isStreaming: boolean;
  streamUrl?: string;
}

export function OutputPreview({ isStreaming, streamUrl }: OutputPreviewProps) {
  return (
    <div className="space-y-3">
      {/* Output Display */}
      <div className="video-container relative bg-black flex items-center justify-center">
        {isStreaming ? (
          streamUrl ? (
            // When we have a stream URL, display the video
            <video
              src={streamUrl}
              autoPlay
              playsInline
              muted
              className="w-full h-full object-cover"
            />
          ) : (
            // Streaming but no URL yet (connecting)
            <div className="text-center">
              <div className="animate-pulse text-4xl mb-2">⚡</div>
              <p className="text-gray-400 text-sm">Connecting to Scope...</p>
              <p className="text-gray-500 text-xs mt-1">
                Initializing StreamDiffusion pipeline
              </p>
            </div>
          )
        ) : (
          // Not streaming - show placeholder
          <div className="text-center">
            <div className="text-6xl mb-4 opacity-50">🎭</div>
            <p className="text-gray-400">AI Output</p>
            <p className="text-gray-500 text-xs mt-1">
              Start generation to see your MetaDJ avatar
            </p>
          </div>
        )}
      </div>

      {/* Stats Bar */}
      <div className="flex justify-between text-xs text-gray-500 px-1">
        <span>FPS: {isStreaming ? "~8" : "N/A"}</span>
        <span>512×512</span>
        <span>Status: {isStreaming ? "Running" : "Idle"}</span>
      </div>
    </div>
  );
}
