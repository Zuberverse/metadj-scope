"use client";

interface ConnectionStatusProps {
  isConnected: boolean;
  apiUrl: string;
}

export function ConnectionStatus({ isConnected, apiUrl }: ConnectionStatusProps) {
  const normalizedUrl = apiUrl.replace(/^https?:\/\//, "");
  const isConfigured = apiUrl && apiUrl !== "Not configured";
  const displayUrl = isConfigured
    ? normalizedUrl.length > 30
      ? `${normalizedUrl.slice(0, 30)}...`
      : normalizedUrl
    : "Not configured";
  const statusLabel = isConnected ? "Connected" : "Disconnected";
  const ariaLabel = isConfigured
    ? `${statusLabel}. Scope API ${apiUrl}`
    : `${statusLabel}. Scope API not configured`;

  return (
    <div
      className="flex items-center gap-2 px-3 py-2 bg-scope-surface rounded-lg"
      role="status"
      aria-live="polite"
      aria-atomic="true"
      aria-label={ariaLabel}
    >
      <div
        className={`w-2 h-2 rounded-full ${
          isConnected ? "bg-scope-success" : "bg-scope-error"
        }`}
      />
      <span className="text-sm text-gray-300">{statusLabel}</span>
      <span className="text-xs text-gray-500 hidden md:inline" title={isConfigured ? apiUrl : undefined}>
        {displayUrl}
      </span>
    </div>
  );
}
