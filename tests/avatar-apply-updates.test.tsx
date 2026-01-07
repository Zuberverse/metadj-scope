import React from "react";
import { act } from "react";
import { createRoot } from "react-dom/client";
import { describe, expect, it, vi } from "vitest";
import { AvatarStudio } from "../src/components/AvatarStudio";

// Mock Next.js Image component - filter out Next.js-specific props
vi.mock("next/image", () => ({
  default: function MockImage({ src, alt, fill, unoptimized, priority, ...rest }: Record<string, unknown>) {
    // Silence unused variable warnings by void-ing them
    void fill; void unoptimized; void priority;
    // eslint-disable-next-line @next/next/no-img-element
    return <img src={src as string} alt={alt as string} {...rest} />;
  },
}));

vi.mock("@/lib/scope", () => ({
  getScopeClient: () => ({
    checkHealth: async () => ({ status: "ok" }),
  }),
  useScopeConnection: () => ({
    connectionState: "disconnected",
    statusMessage: "",
    error: null,
    reconnectAttempts: 0,
    peerConnection: null,
    dataChannel: null,
    connect: vi.fn(),
    disconnect: vi.fn(),
    clearError: vi.fn(),
    retry: vi.fn(),
  }),
}));

function renderAvatarStudio() {
  const container = document.createElement("div");
  document.body.appendChild(container);
  const root = createRoot(container);

  act(() => {
    root.render(<AvatarStudio onConnectionChange={() => undefined} />);
  });

  return {
    container,
    unmount: () => {
      act(() => root.unmount());
      container.remove();
    },
  };
}

describe("Avatar Studio apply updates", () => {
  it("renders a disabled Apply Updates button before streaming", async () => {
    const { container, unmount } = renderAvatarStudio();

    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 0));
    });

    const buttons = Array.from(container.querySelectorAll("button"));
    const applyButton = buttons.find((button) => button.textContent?.includes("Apply Updates"));

    expect(applyButton).toBeTruthy();
    expect(applyButton?.hasAttribute("disabled")).toBe(true);

    unmount();
  });
});
