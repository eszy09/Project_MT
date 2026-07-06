import { beforeEach, describe, expect, it } from "vitest";
import {
  activeWorkoutStorageKey,
  clearActiveWorkoutDraft,
  loadActiveWorkoutDraft,
  saveActiveWorkoutDraft,
} from "./active-workout-storage";
import {
  activeWorkoutReducer,
  createActiveWorkoutState,
} from "./active-workout-state";
import { exerciseCatalog } from "./exercise-catalog";

const ownerKey = "owner-key-123";
const startedAt = "2026-07-06T01:00:00Z";
const completionKey = "completion-key-123";

function workoutState() {
  let state = createActiveWorkoutState(startedAt, completionKey);
  state = activeWorkoutReducer(state, {
    type: "exercise-added",
    exercise: exerciseCatalog[0],
    id: "exercise-id",
    setId: "set-id",
  });
  state = activeWorkoutReducer(state, {
    type: "set-value-changed",
    exerciseId: "exercise-id",
    setId: "set-id",
    field: "weightKg",
    value: "100",
  });
  state = activeWorkoutReducer(state, {
    type: "set-value-changed",
    exerciseId: "exercise-id",
    setId: "set-id",
    field: "repetitions",
    value: "5",
  });

  return state;
}

beforeEach(() => {
  window.localStorage.clear();
});

describe("active workout draft storage", () => {
  it("round-trips recoverable state without transient UI state", () => {
    let state = workoutState();
    state = activeWorkoutReducer(state, {
      type: "set-completion-toggled",
      exerciseId: "exercise-id",
      setId: "set-id",
      completedAt: "2026-07-06T01:10:00Z",
    });
    state = {
      ...state,
      status: "saving",
      error: "Temporary error",
      requestId: "request-id",
    };
    const savedAt = "2026-07-06T01:11:00Z";

    expect(saveActiveWorkoutDraft(ownerKey, state, savedAt)).toBe(true);

    const result = loadActiveWorkoutDraft(
      ownerKey,
      Date.parse("2026-07-06T01:12:00Z"),
    );
    expect(result.status).toBe("available");

    if (result.status !== "available") {
      throw new Error("Expected a recoverable workout draft.");
    }

    expect(result.savedAt).toBe(savedAt);
    expect(result.draft).toMatchObject({
      startedAt,
      completionKey,
      exercises: [
        {
          exerciseCode: "back-squat",
          sets: [
            {
              weightKg: "100",
              repetitions: "5",
              completedAt: "2026-07-06T01:10:00Z",
              showValidation: false,
            },
          ],
        },
      ],
    });
    expect(result.draft).not.toHaveProperty("status");
    expect(result.draft).not.toHaveProperty("error");
    expect(result.draft).not.toHaveProperty("requestId");
  });

  it("isolates drafts by the pseudonymous owner key", () => {
    expect(saveActiveWorkoutDraft(ownerKey, workoutState())).toBe(true);

    expect(loadActiveWorkoutDraft("different-owner")).toEqual({
      status: "none",
    });
    expect(loadActiveWorkoutDraft(ownerKey).status).toBe("available");
  });

  it("removes expired and malformed drafts instead of loading them", () => {
    const savedAt = "2026-07-01T00:00:00Z";
    saveActiveWorkoutDraft(ownerKey, workoutState(), savedAt);

    expect(
      loadActiveWorkoutDraft(ownerKey, Date.parse("2026-07-09T00:00:01Z")),
    ).toEqual({ status: "none" });
    expect(
      window.localStorage.getItem(activeWorkoutStorageKey(ownerKey)),
    ).toBeNull();

    window.localStorage.setItem(
      activeWorkoutStorageKey(ownerKey),
      '{"version":1,"draft":"invalid"}',
    );
    expect(loadActiveWorkoutDraft(ownerKey)).toEqual({ status: "none" });
    expect(
      window.localStorage.getItem(activeWorkoutStorageKey(ownerKey)),
    ).toBeNull();
  });

  it("clears a draft only for the selected owner", () => {
    saveActiveWorkoutDraft(ownerKey, workoutState());
    saveActiveWorkoutDraft("different-owner", workoutState());

    expect(clearActiveWorkoutDraft(ownerKey)).toBe(true);

    expect(loadActiveWorkoutDraft(ownerKey)).toEqual({ status: "none" });
    expect(loadActiveWorkoutDraft("different-owner").status).toBe("available");
  });
});
