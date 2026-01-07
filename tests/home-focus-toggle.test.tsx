import { describe, expect, it, vi } from "vitest";

// Mock Next.js redirect
const mockRedirect = vi.fn();
vi.mock("next/navigation", () => ({
  redirect: (url: string) => {
    mockRedirect(url);
    // redirect() throws in Next.js to halt execution
    throw new Error("NEXT_REDIRECT");
  },
}));

describe("Home page redirect", () => {
  it("redirects to /soundscape (MVP behavior)", async () => {
    // Import after mocking
    const { default: Home } = await import("../src/app/page");

    expect(() => Home()).toThrow("NEXT_REDIRECT");
    expect(mockRedirect).toHaveBeenCalledWith("/soundscape");
  });
});
