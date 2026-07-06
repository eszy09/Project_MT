import { describe, expect, it } from "vitest";
import {
  activeWorkoutReducer,
  createActiveWorkoutState,
  type ActiveWorkoutState,
} from "./active-workout-state";
import { exerciseCatalog } from "./exercise-catalog";

const startedAt = "2026-07-06T10:00:00Z";

describe("activeWorkoutReducer", () => {
  it("adds, reorders, and removes exercises", () => {
    let state = createActiveWorkoutState(startedAt);

    state = activeWorkoutReducer(state, {
      type: "exercise-added",
      exercise: exerciseCatalog[0],
      id: "first",
    });
    state = activeWorkoutReducer(state, {
      type: "exercise-added",
      exercise: exerciseCatalog[1],
      id: "second",
    });

    expect(state.exercises.map((exercise) => exercise.id)).toEqual([
      "first",
      "second",
    ]);
    expect(state.dirty).toBe(true);

    state = activeWorkoutReducer(state, {
      type: "exercise-moved",
      id: "second",
      direction: "up",
    });

    expect(state.exercises.map((exercise) => exercise.id)).toEqual([
      "second",
      "first",
    ]);

    state = activeWorkoutReducer(state, {
      type: "exercise-removed",
      id: "second",
    });

    expect(state.exercises.map((exercise) => exercise.id)).toEqual(["first"]);
  });

  it("does not add the same canonical exercise twice", () => {
    let state = createActiveWorkoutState(startedAt);

    state = activeWorkoutReducer(state, {
      type: "exercise-added",
      exercise: exerciseCatalog[0],
      id: "first",
    });
    state = activeWorkoutReducer(state, {
      type: "exercise-added",
      exercise: exerciseCatalog[0],
      id: "duplicate",
    });

    expect(state.exercises).toHaveLength(1);
    expect(state.error).toMatch(/already in this workout/i);
  });

  it("blocks completion until a set is completed", () => {
    let state = createActiveWorkoutState(startedAt);

    state = activeWorkoutReducer(state, {
      type: "completion-requested",
    });
    expect(state.error).toMatch(/add at least one exercise/i);

    state = activeWorkoutReducer(state, {
      type: "exercise-added",
      exercise: exerciseCatalog[0],
      id: "exercise",
    });
    state = activeWorkoutReducer(state, {
      type: "completion-requested",
    });

    expect(state.error).toMatch(/complete at least one set/i);
    expect(state.status).toBe("editing");
  });

  it("represents saving, error, and completed states", () => {
    const stateWithCompletedSet: ActiveWorkoutState = {
      ...createActiveWorkoutState(startedAt),
      dirty: true,
      exercises: [
        {
          id: "exercise",
          exerciseCode: "back-squat",
          displayName: "Back Squat",
          notes: "",
          sets: [
            {
              id: "set",
              weightKg: "100",
              repetitions: "5",
              completedAt: "2026-07-06T10:20:00Z",
              notes: "",
            },
          ],
        },
      ],
    };

    const saving = activeWorkoutReducer(stateWithCompletedSet, {
      type: "completion-requested",
    });
    expect(saving.status).toBe("saving");

    const failed = activeWorkoutReducer(saving, {
      type: "save-failed",
      message: "Workout could not be saved.",
    });
    expect(failed.status).toBe("editing");
    expect(failed.error).toBe("Workout could not be saved.");

    const completed = activeWorkoutReducer(failed, {
      type: "save-completed",
      workout: {
        id: "workout",
        durationSeconds: 1200,
        exerciseCount: 1,
        completedSetCount: 1,
      },
    });
    expect(completed.status).toBe("completed");
    expect(completed.dirty).toBe(false);
    expect(completed.completedWorkout?.id).toBe("workout");
  });
});
