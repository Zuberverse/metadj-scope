"use client";

interface ConnectionStatusProps {
  isConnected: boolean;
  apiUrl: string;
}

export function ConnectionStatus({ isConnected, apiUrl }: ConnectionStatusProps) {
  const normalizedUrl = apiUrl.replace(/^https?:\/\//, "");
  const isConfigured = apiUrl && apiUrl !== "Not configured";
  const displayUrl = isConfigured
    ? normalizedUrl.length > 20
      ? `${normalizedUrl.slice(0, 20)}...`
      : normalizedUrl
    : "Not configured";
  const statusLabel = isConnected ? "Connected" : "Disconnected";
  const ariaLabel = isConfigured
    ? `${statusLabel}. Scope API ${apiUrl}`
    : `${statusLabel}. Scope API not configured`;

  return (
    <div
      className="flex items-center gap-4 px-6 py-3 glass-radiant rounded-full border border-white/10 shadow-2xl transition-all duration-500 hover:scale-[1.02]"
      role="status"
      aria-live="polite"
      aria-atomic="true"
      aria-label={ariaLabel}
    >
      <div className="relative">
        <div
          className={`w-2.5 h-2.5 rounded-full transition-all duration-500 ${isConnected
            ? "bg-green-500 shadow-[0_0_15px_rgba(34,197,94,0.8)]"
            : "bg-red-500 shadow-[0_0_15px_rgba(239,68,68,0.8)]"
            }`}
        />
        {isConnected && (
          <div className="absolute inset-0 w-2.5 h-2.5 rounded-full bg-green-500 animate-ping opacity-40 scale-[1.5]" />
        )}
      </div>
      <div className="flex flex-col gap-0.5">
        <div className="flex items-center gap-2">
          <span className={`text-[10px] font-black uppercase tracking-[0.2em] ${isConnected ? 'text-white' : 'text-white/40'}`}>
            {statusLabel}
          </span>
          <div className="h-px w-3 bg-white/10" />
        </div>
        <span className="text-[9px] text-white/20 font-mono tracking-tighter truncate max-w-[120px]" title={isConfigured ? apiUrl : undefined}>
          {displayUrl}
        </span>
      </div>
    </div>
  );
}
