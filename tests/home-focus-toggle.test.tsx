import React from "react";
import { act } from "react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { createRoot } from "react-dom/client";
import Home from "../src/app/page";

vi.mock("next/dynamic", () => ({
  default: () => {
    return function DynamicStub() {
      return <div data-testid="dynamic-studio" />;
    };
  },
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

function renderHome() {
  const container = document.createElement("div");
  document.body.appendChild(container);
  const root = createRoot(container);

  act(() => {
    root.render(<Home />);
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
  document.body.innerHTML = "";
});

describe("Home focus toggle", () => {
  it("switches focus mode from Soundscape to Avatar Studio", () => {
    const { container, unmount } = renderHome();

    const focusHeading = container.querySelector('[data-testid="focus-heading"]');
    expect(focusHeading?.textContent).toContain("Soundscape");

    const buttons = Array.from(container.querySelectorAll("button"));
    const avatarButton = buttons.find((button) => button.textContent?.includes("Avatar Studio"));
    const soundscapeButton = buttons.find((button) => button.textContent?.includes("Soundscape"));

    expect(soundscapeButton?.getAttribute("aria-pressed")).toBe("true");
    expect(avatarButton?.getAttribute("aria-pressed")).toBe("false");

    act(() => {
      avatarButton?.dispatchEvent(new MouseEvent("click", { bubbles: true }));
    });

    expect(avatarButton?.getAttribute("aria-pressed")).toBe("true");
    expect(soundscapeButton?.getAttribute("aria-pressed")).toBe("false");
    expect(focusHeading?.textContent).toContain("Avatar Studio");

    unmount();
  });
});
