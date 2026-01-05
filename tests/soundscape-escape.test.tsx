import React from "react";
import { act } from "react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { createRoot } from "react-dom/client";
import SoundscapePage from "../src/app/soundscape/page";

const pushMock = vi.fn();

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: pushMock }),
}));

vi.mock("next/link", () => ({
  default: ({
    href,
    children,
    ...props
  }: React.AnchorHTMLAttributes<HTMLAnchorElement> & { href: string }) => (
    <a href={href} {...props}>
      {children}
    </a>
  ),
}));

vi.mock("@/components/soundscape", () => ({
  SoundscapeStudio: () => <div data-testid="soundscape-stub" />,
}));

function renderSoundscape() {
  const container = document.createElement("div");
  document.body.appendChild(container);
  const root = createRoot(container);

  act(() => {
    root.render(<SoundscapePage />);
  });

  return {
    container,
    unmount: () => {
      act(() => root.unmount());
      container.remove();
    },
  };
}

afterEach(() => {
  pushMock.mockClear();
  document.body.innerHTML = "";
});

describe("Soundscape escape shortcut", () => {
  it("returns to home on Escape", () => {
    const { unmount } = renderSoundscape();

    act(() => {
      window.dispatchEvent(new KeyboardEvent("keydown", { key: "Escape" }));
    });

    expect(pushMock).toHaveBeenCalledWith("/");

    unmount();
  });
});
