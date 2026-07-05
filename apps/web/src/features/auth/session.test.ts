import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  getSession: vi.fn(),
  redirect: vi.fn(),
}));

vi.mock("server-only", () => ({}));
vi.mock("@/lib/auth0", () => ({
  auth0: {
    getSession: mocks.getSession,
  },
}));
vi.mock("next/navigation", () => ({
  redirect: mocks.redirect,
}));

import { getOptionalSession, requireSession } from "./session";

describe("session helpers", () => {
  beforeEach(() => {
    mocks.getSession.mockReset();
    mocks.redirect.mockReset();
    mocks.redirect.mockImplementation(() => {
      throw new Error("NEXT_REDIRECT");
    });
  });

  it("returns a valid server-side session", async () => {
    const session = {
      user: {
        sub: "auth0|test-user",
      },
    };
    mocks.getSession.mockResolvedValue(session);

    await expect(getOptionalSession()).resolves.toBe(session);
  });

  it("treats an invalid or expired session as signed out", async () => {
    mocks.getSession.mockRejectedValue(new Error("Invalid encrypted session"));

    await expect(getOptionalSession()).resolves.toBeNull();
  });

  it("redirects an unauthenticated protected route to sign-in", async () => {
    mocks.getSession.mockResolvedValue(null);

    await expect(requireSession("/dashboard")).rejects.toThrow("NEXT_REDIRECT");
    expect(mocks.redirect).toHaveBeenCalledWith(
      "/auth/login?returnTo=%2Fdashboard",
    );
  });
});
