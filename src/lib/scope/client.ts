/**
 * Scope API Client
 * Handles communication with the Daydream Scope API server
 */

import type { HealthResponse, StreamConfig, StreamStatus } from "./types";

export class ScopeClient {
  private baseUrl: string;

  constructor(baseUrl?: string) {
    this.baseUrl = baseUrl || process.env.SCOPE_API_URL || "http://localhost:8000";
    // Remove trailing slash if present
    this.baseUrl = this.baseUrl.replace(/\/$/, "");
  }

  /**
   * Check API health and connectivity
   */
  async checkHealth(): Promise<HealthResponse> {
    try {
      const response = await fetch(`${this.baseUrl}/health`, {
        method: "GET",
        headers: { "Content-Type": "application/json" },
      });

      if (!response.ok) {
        return { status: "error" };
      }

      const data = await response.json();
      return {
        status: "ok",
        version: data.version,
        gpu: data.gpu,
        vram: data.vram,
      };
    } catch (error) {
      console.error("[Scope] Health check failed:", error);
      return { status: "error" };
    }
  }

  /**
   * Get available pipelines
   */
  async getPipelines(): Promise<string[]> {
    try {
      const response = await fetch(`${this.baseUrl}/pipelines`, {
        method: "GET",
        headers: { "Content-Type": "application/json" },
      });

      if (!response.ok) {
        throw new Error(`Failed to get pipelines: ${response.status}`);
      }

      return response.json();
    } catch (error) {
      console.error("[Scope] Failed to get pipelines:", error);
      return [];
    }
  }

  /**
   * Create a new stream for real-time generation
   */
  async createStream(config: StreamConfig): Promise<{ streamId: string; whipUrl: string } | null> {
    try {
      const response = await fetch(`${this.baseUrl}/v1/streams`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(config),
      });

      if (!response.ok) {
        throw new Error(`Failed to create stream: ${response.status}`);
      }

      return response.json();
    } catch (error) {
      console.error("[Scope] Failed to create stream:", error);
      return null;
    }
  }

  /**
   * Get stream status
   */
  async getStreamStatus(streamId: string): Promise<StreamStatus | null> {
    try {
      const response = await fetch(`${this.baseUrl}/v1/streams/${streamId}/status`, {
        method: "GET",
        headers: { "Content-Type": "application/json" },
      });

      if (!response.ok) {
        throw new Error(`Failed to get stream status: ${response.status}`);
      }

      return response.json();
    } catch (error) {
      console.error("[Scope] Failed to get stream status:", error);
      return null;
    }
  }

  /**
   * Update stream parameters (live parameter updates)
   */
  async updateStream(streamId: string, updates: Partial<StreamConfig>): Promise<boolean> {
    try {
      const response = await fetch(`${this.baseUrl}/v1/streams/${streamId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updates),
      });

      return response.ok;
    } catch (error) {
      console.error("[Scope] Failed to update stream:", error);
      return false;
    }
  }

  /**
   * Stop and delete a stream
   */
  async deleteStream(streamId: string): Promise<boolean> {
    try {
      const response = await fetch(`${this.baseUrl}/v1/streams?id=${streamId}`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
      });

      return response.ok;
    } catch (error) {
      console.error("[Scope] Failed to delete stream:", error);
      return false;
    }
  }

  /**
   * Get the base URL for this client
   */
  getBaseUrl(): string {
    return this.baseUrl;
  }
}

// Singleton instance for the app
let scopeClientInstance: ScopeClient | null = null;

export function getScopeClient(): ScopeClient {
  if (!scopeClientInstance) {
    scopeClientInstance = new ScopeClient();
  }
  return scopeClientInstance;
}
