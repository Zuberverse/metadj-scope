/**
 * Shared Scope WebRTC Connection Hook
 * Manages WebRTC connection lifecycle, reconnection logic, and cleanup
 */

"use client";

import { useCallback, useRef, useState } from "react";
import type { ScopeClient } from "./client";
import type { PipelineLoadParams } from "./types";
import { createScopeWebRtcSession, type ScopeDataChannelConfig } from "./webrtc";
import { prepareScopePipeline } from "./pipeline";

// ============================================================================
// Typed Error Handling
// ============================================================================

export type ScopeErrorCode =
  | "HEALTH_CHECK_FAILED"
  | "PIPELINE_LOAD_FAILED"
  | "CONNECTION_FAILED"
  | "CONNECTION_LOST"
  | "STREAM_STOPPED"
  | "DATA_CHANNEL_ERROR"
  | "UNKNOWN";

export interface ScopeError {
  code: ScopeErrorCode;
  message: string;
  recoverable: boolean;
}

export function createScopeError(
  code: ScopeErrorCode,
  message: string,
  recoverable = true
): ScopeError {
  return { code, message, recoverable };
}

// ============================================================================
// Connection State
// ============================================================================

export type ConnectionState =
  | "disconnected"
  | "connecting"
  | "connected"
  | "reconnecting"
  | "failed";

export interface UseScopeConnectionOptions {
  /** Scope client instance */
  scopeClient: ScopeClient;
  /** Pipeline ID to load */
  pipelineId: string;
  /** Pipeline load parameters */
  loadParams?: PipelineLoadParams;
  /** Max reconnection attempts */
  maxReconnectAttempts?: number;
  /** Base delay between reconnection attempts (ms) */
  reconnectBaseDelay?: number;
  /** Callback when stream is received */
  onStream?: (stream: MediaStream) => void;
  /** Callback when data channel opens */
  onDataChannelOpen?: (channel: RTCDataChannel) => void;
  /** Callback when data channel closes */
  onDataChannelClose?: () => void;
  /** Callback when data channel receives a message */
  onDataChannelMessage?: (event: MessageEvent) => void;
  /** Custom peer connection setup */
  setupPeerConnection?: (pc: RTCPeerConnection) => void;
  /** Initial WebRTC parameters */
  initialParameters?: Record<string, unknown>;
}

export interface UseScopeConnectionReturn {
  /** Current connection state */
  connectionState: ConnectionState;
  /** Human-readable status message */
  statusMessage: string;
  /** Current error (if any) */
  error: ScopeError | null;
  /** Current reconnection attempt count */
  reconnectAttempts: number;
  /** Reference to peer connection */
  peerConnection: RTCPeerConnection | null;
  /** Reference to data channel */
  dataChannel: RTCDataChannel | null;
  /** Connect to Scope */
  connect: () => Promise<void>;
  /** Disconnect from Scope */
  disconnect: (preserveError?: boolean) => void;
  /** Clear current error */
  clearError: () => void;
  /** Retry connection (resets attempts) */
  retry: () => void;
}

// ============================================================================
// Hook Implementation
// ============================================================================

export function useScopeConnection(
  options: UseScopeConnectionOptions
): UseScopeConnectionReturn {
  const {
    scopeClient,
    pipelineId,
    loadParams,
    maxReconnectAttempts = 3,
    reconnectBaseDelay = 2000,
    onStream,
    onDataChannelOpen,
    onDataChannelClose,
    onDataChannelMessage,
    setupPeerConnection,
    initialParameters,
  } = options;

  // State
  const [connectionState, setConnectionState] = useState<ConnectionState>("disconnected");
  const [statusMessage, setStatusMessage] = useState("");
  const [error, setError] = useState<ScopeError | null>(null);
  const [reconnectAttempts, setReconnectAttempts] = useState(0);

  // Refs
  const peerConnectionRef = useRef<RTCPeerConnection | null>(null);
  const dataChannelRef = useRef<RTCDataChannel | null>(null);
  const reconnectTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Clear reconnect timer
  const clearReconnectTimer = useCallback(() => {
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }
  }, []);

  // Cleanup connection resources
  const cleanup = useCallback(() => {
    clearReconnectTimer();

    if (dataChannelRef.current) {
      dataChannelRef.current.onopen = null;
      dataChannelRef.current.onclose = null;
      dataChannelRef.current.onmessage = null;
      dataChannelRef.current.close();
      dataChannelRef.current = null;
    }

    if (peerConnectionRef.current) {
      peerConnectionRef.current.onicecandidate = null;
      peerConnectionRef.current.ontrack = null;
      peerConnectionRef.current.onconnectionstatechange = null;
      peerConnectionRef.current.close();
      peerConnectionRef.current = null;
    }
  }, [clearReconnectTimer]);

  // Disconnect
  const disconnect = useCallback(
    (preserveError = false) => {
      cleanup();
      setConnectionState("disconnected");
      setStatusMessage("");
      if (!preserveError) {
        setError(null);
      }
    },
    [cleanup]
  );

  // Handle connection lost - attempt reconnection
  const handleConnectionLost = useCallback(
    (reason: string) => {
      setReconnectAttempts((prev) => {
        const next = prev + 1;
        if (next > maxReconnectAttempts) {
          setError(createScopeError("CONNECTION_LOST", `${reason}. Max retries exceeded.`, true));
          setConnectionState("failed");
          return prev;
        }

        const delay = reconnectBaseDelay * next;
        setStatusMessage(`Reconnecting (${next}/${maxReconnectAttempts})...`);
        setConnectionState("reconnecting");

        clearReconnectTimer();
        reconnectTimeoutRef.current = setTimeout(() => {
          // Trigger reconnect by calling connect again
          // The connect function will be called from the component
        }, delay);

        return next;
      });
    },
    [maxReconnectAttempts, reconnectBaseDelay, clearReconnectTimer]
  );

  // Connect to Scope
  const connect = useCallback(async () => {
    setConnectionState("connecting");
    setError(null);

    try {
      // Step 1: Health check
      setStatusMessage("Checking server...");
      const health = await scopeClient.checkHealth();
      if (health.status !== "ok") {
        throw createScopeError("HEALTH_CHECK_FAILED", "Scope server is not healthy. Is the pod running?");
      }

      // Step 2: Load pipeline
      await prepareScopePipeline({
        scopeClient,
        pipelineId,
        loadParams: loadParams ?? {},
        onStatus: setStatusMessage,
      });

      // Step 3: Create WebRTC session
      setStatusMessage("Creating connection...");

      const { pc, dataChannel } = await createScopeWebRtcSession({
        scopeClient,
        initialParameters,
        setupPeerConnection: (connection) => {
          peerConnectionRef.current = connection;
          setupPeerConnection?.(connection);
        },
        onTrack: (event) => {
          if (event.track.kind === "video" && event.streams[0]) {
            onStream?.(event.streams[0]);
            setStatusMessage("Connected");
            setConnectionState("connected");
          }
        },
        onConnectionStateChange: (connection) => {
          if (
            connection.connectionState === "failed" ||
            connection.connectionState === "disconnected"
          ) {
            handleConnectionLost("Connection lost");
          }
        },
        dataChannel: {
          label: "parameters",
          options: { ordered: true },
          onOpen: (channel) => {
            dataChannelRef.current = channel;
            onDataChannelOpen?.(channel);
          },
          onClose: () => {
            dataChannelRef.current = null;
            onDataChannelClose?.();
          },
          onMessage: (event) => {
            // Handle stream_stopped messages
            try {
              const message = JSON.parse(event.data);
              if (message?.type === "stream_stopped") {
                setError(
                  createScopeError("STREAM_STOPPED", message.error_message || "Stream stopped")
                );
                disconnect(true);
                return;
              }
            } catch {
              // Not JSON, pass through
            }
            onDataChannelMessage?.(event);
          },
        } satisfies ScopeDataChannelConfig,
      });

      peerConnectionRef.current = pc;
      dataChannelRef.current = dataChannel ?? null;
      setReconnectAttempts(0);
      setConnectionState("connected");
      setStatusMessage("Connected");
    } catch (err) {
      const scopeError =
        err && typeof err === "object" && "code" in err
          ? (err as ScopeError)
          : createScopeError(
              "CONNECTION_FAILED",
              err instanceof Error ? err.message : "Connection failed"
            );
      setError(scopeError);
      setConnectionState("failed");
      cleanup();
    }
  }, [
    scopeClient,
    pipelineId,
    loadParams,
    initialParameters,
    setupPeerConnection,
    onStream,
    onDataChannelOpen,
    onDataChannelClose,
    onDataChannelMessage,
    handleConnectionLost,
    disconnect,
    cleanup,
  ]);

  // Clear error
  const clearError = useCallback(() => {
    setError(null);
  }, []);

  // Retry connection
  const retry = useCallback(() => {
    setReconnectAttempts(0);
    setError(null);
    connect();
  }, [connect]);

  return {
    connectionState,
    statusMessage,
    error,
    reconnectAttempts,
    peerConnection: peerConnectionRef.current,
    dataChannel: dataChannelRef.current,
    connect,
    disconnect,
    clearError,
    retry,
  };
}
