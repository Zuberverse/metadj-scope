"use client";

interface ConnectionStatusProps {
  isConnected: boolean;
  apiUrl: string;
}

export function ConnectionStatus({ isConnected, apiUrl }: ConnectionStatusProps) {
  return (
    <div
      className="flex items-center gap-2 px-3 py-2 bg-scope-surface rounded-lg"
      role="status"
      aria-live="polite"
      aria-atomic="true"
    >
      <div
        className={`w-2 h-2 rounded-full ${
          isConnected ? "bg-scope-success" : "bg-scope-error"
        }`}
      />
      <span className="text-sm text-gray-400">
        {isConnected ? "Connected" : "Disconnected"}
      </span>
      <span className="text-xs text-gray-600 hidden md:inline">
        {apiUrl.replace("https://", "").replace("http://", "").slice(0, 30)}...
      </span>
    </div>
  );
}
