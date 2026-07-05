import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  OnboardingApiError,
  getOnboardingDraft,
  saveBodyContextStage,
} from "./onboarding-api";

const mocks = vi.hoisted(() => ({
  getAccessToken: vi.fn(),
}));

vi.mock("server-only", () => ({}));
vi.mock("@/lib/auth0", () => ({
  auth0: {
    getAccessToken: mocks.getAccessToken,
  },
}));

const requestId = "11111111-1111-4111-8111-111111111111";

describe("onboarding API correlation", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    mocks.getAccessToken.mockReset();
    mocks.getAccessToken.mockResolvedValue({
      token: "secret-access-token",
      expiresAt: 1,
    });
    vi.spyOn(globalThis.crypto, "randomUUID").mockReturnValue(requestId);
  });

  it("sends a request ID to the API", async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(
        JSON.stringify({
          id: "profile-id",
          displayName: "Taylor",
          primaryGoal: null,
          targetAreas: [],
          experienceLevel: null,
          heightCm: null,
          weightKg: null,
          onboardingStep: 1,
          completed: false,
          completedAt: null,
          updatedAt: "2026-07-06T00:00:00Z",
        }),
        {
          status: 200,
          headers: {
            "Content-Type": "application/json",
            "X-Request-ID": requestId,
          },
        },
      ),
    );
    vi.stubGlobal("fetch", fetchMock);

    await getOnboardingDraft();

    const requestInit = fetchMock.mock.calls[0][1] as RequestInit;
    const headers = new Headers(requestInit.headers);
    expect(headers.get("X-Request-ID")).toBe(requestId);
    expect(headers.get("Authorization")).toBe("Bearer secret-access-token");
  });

  it("logs only allowlisted metadata and returns the API correlation ID", async () => {
    const apiRequestId = "api-generated-request-id";
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(
        new Response(
          JSON.stringify({
            detail: "The request could not be completed.",
          }),
          {
            status: 500,
            headers: {
              "Content-Type": "application/problem+json",
              "X-Request-ID": apiRequestId,
            },
          },
        ),
      ),
    );
    const consoleError = vi
      .spyOn(console, "error")
      .mockImplementation(() => undefined);

    const failure = await saveBodyContextStage({
      experienceLevel: "INTERMEDIATE",
      heightCm: 178.5,
      weightKg: 79.2,
    }).catch((error: unknown) => error);

    expect(failure).toBeInstanceOf(OnboardingApiError);
    expect((failure as OnboardingApiError).requestId).toBe(apiRequestId);

    const loggedData = String(consoleError.mock.calls[0][0]);
    expect(loggedData).toContain(apiRequestId);
    expect(loggedData).toContain("api_request_failed");
    expect(loggedData).not.toContain("secret-access-token");
    expect(loggedData).not.toContain("178.5");
    expect(loggedData).not.toContain("79.2");
  });

  it("does not report a missing onboarding draft as an operational failure", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(
        new Response(
          JSON.stringify({
            detail: "The requested resource was not found.",
          }),
          {
            status: 404,
            headers: {
              "Content-Type": "application/problem+json",
              "X-Request-ID": requestId,
            },
          },
        ),
      ),
    );
    const consoleError = vi
      .spyOn(console, "error")
      .mockImplementation(() => undefined);

    await expect(getOnboardingDraft()).resolves.toBeNull();
    expect(consoleError).not.toHaveBeenCalled();
  });
});
