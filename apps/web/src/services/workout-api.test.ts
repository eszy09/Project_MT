import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  WorkoutApiError,
  getPreviousPerformance,
  getWorkoutHistory,
  saveCompletedWorkout,
  type WorkoutCompletionInput,
} from "./workout-api";

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
const idempotencyKey = "completion-key-123";
const workout: WorkoutCompletionInput = {
  startedAt: "2026-07-06T10:00:00Z",
  completedAt: "2026-07-06T10:20:00Z",
  exercises: [
    {
      exerciseCode: "back-squat",
      displayName: "Back Squat",
      sets: [
        {
          weightKg: 100,
          repetitions: 5,
          completedAt: "2026-07-06T10:10:00Z",
        },
      ],
    },
  ],
};
const workoutResponse = {
  id: "22222222-2222-4222-8222-222222222222",
  status: "COMPLETED",
  startedAt: workout.startedAt,
  completedAt: workout.completedAt,
  durationSeconds: 1200,
  exerciseCount: 1,
  setCount: 1,
  completedSetCount: 1,
  createdAt: "2026-07-06T10:20:01Z",
};

describe("workout API completion", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    mocks.getAccessToken.mockReset();
    mocks.getAccessToken.mockResolvedValue({
      token: "secret-access-token",
      expiresAt: 1,
    });
    vi.spyOn(globalThis.crypto, "randomUUID").mockReturnValue(requestId);
  });

  it("sends the stable idempotency key and request correlation headers", async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(JSON.stringify(workoutResponse), {
        status: 201,
        headers: {
          "Content-Type": "application/json",
          "X-Request-ID": requestId,
        },
      }),
    );
    vi.stubGlobal("fetch", fetchMock);

    await expect(
      saveCompletedWorkout(workout, idempotencyKey),
    ).resolves.toEqual(workoutResponse);

    const [url, requestInit] = fetchMock.mock.calls[0] as [string, RequestInit];
    const headers = new Headers(requestInit.headers);
    expect(url).toBe("http://localhost:8080/api/v1/workouts");
    expect(requestInit.method).toBe("POST");
    expect(headers.get("Authorization")).toBe("Bearer secret-access-token");
    expect(headers.get("Idempotency-Key")).toBe(idempotencyKey);
    expect(headers.get("X-Request-ID")).toBe(requestId);
    expect(JSON.parse(String(requestInit.body))).toEqual(workout);
  });

  it("accepts the API response for an idempotent replay", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(
        new Response(JSON.stringify(workoutResponse), {
          status: 200,
          headers: {
            "Content-Type": "application/json",
          },
        }),
      ),
    );

    await expect(
      saveCompletedWorkout(workout, idempotencyKey),
    ).resolves.toEqual(workoutResponse);
  });

  it("returns the API correlation ID without logging payload secrets", async () => {
    const apiRequestId = "api-generated-request-id";
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(
        new Response(
          JSON.stringify({
            detail: "The workout conflicts with an existing request.",
          }),
          {
            status: 409,
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

    const failure = await saveCompletedWorkout(workout, idempotencyKey).catch(
      (error: unknown) => error,
    );

    expect(failure).toBeInstanceOf(WorkoutApiError);
    expect((failure as WorkoutApiError).requestId).toBe(apiRequestId);
    expect((failure as WorkoutApiError).status).toBe(409);

    const loggedData = String(consoleError.mock.calls[0][0]);
    expect(loggedData).toContain(apiRequestId);
    expect(loggedData).toContain("api_request_failed");
    expect(loggedData).not.toContain("secret-access-token");
    expect(loggedData).not.toContain(idempotencyKey);
    expect(loggedData).not.toContain("back-squat");
  });

  it("loads encoded history filters with authenticated correlation", async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(JSON.stringify({ items: [], nextCursor: null }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }),
    );
    vi.stubGlobal("fetch", fetchMock);

    await getWorkoutHistory({
      exerciseCode: "back-squat",
      cursor: "cursor/value",
      limit: 20,
    });

    const [url, requestInit] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect(url).toContain("exerciseCode=back-squat");
    expect(url).toContain("cursor=cursor%2Fvalue");
    const headers = new Headers(requestInit.headers);
    expect(headers.get("Authorization")).toBe("Bearer secret-access-token");
    expect(headers.get("X-Request-ID")).toBe(requestId);
  });

  it("treats missing previous performance as an empty state", async () => {
    vi.stubGlobal(
      "fetch",
      vi
        .fn()
        .mockResolvedValue(
          new Response(
            JSON.stringify({ detail: "The resource was not found." }),
            { status: 404 },
          ),
        ),
    );

    await expect(getPreviousPerformance("back-squat")).resolves.toBeNull();
  });
});
