import React from "react";
import { act } from "react";
import { createRoot } from "react-dom/client";
import { describe, expect, it, vi } from "vitest";
import { AvatarStudio } from "../src/components/AvatarStudio";

vi.mock("next/image", () => ({
  default: (props: React.ImgHTMLAttributes<HTMLImageElement>) => {
    const { src, alt, fill, unoptimized, ...rest } = props;
    return <img src={src as string} alt={alt} {...rest} />;
  },
}));

vi.mock("@/lib/scope", () => ({
  getScopeClient: () => ({
    checkHealth: async () => ({ status: "ok" }),
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
