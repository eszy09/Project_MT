import { describe, expect, it } from "vitest";
import {
  activeWorkoutReducer,
  calculateWorkoutVolume,
  createActiveWorkoutState,
  type ActiveWorkoutState,
} from "./active-workout-state";
import { exerciseCatalog } from "./exercise-catalog";

const startedAt = "2026-07-06T10:00:00Z";
const completionKey = "completion-key-123";

function addExercise(state: ActiveWorkoutState, index = 0, id = "exercise") {
  return activeWorkoutReducer(state, {
    type: "exercise-added",
    exercise: exerciseCatalog[index],
    id,
    setId: `${id}-set-1`,
  });
}

describe("activeWorkoutReducer", () => {
  it("adds, reorders, and removes exercises with one initial set", () => {
    let state = createActiveWorkoutState(startedAt, completionKey);

    state = addExercise(state, 0, "first");
    state = addExercise(state, 1, "second");

    expect(state.exercises.map((exercise) => exercise.id)).toEqual([
      "first",
      "second",
    ]);
    expect(state.exercises[0].sets).toHaveLength(1);
    expect(state.exercises[0].sets[0]).toMatchObject({
      weightKg: "",
      repetitions: "",
      completedAt: null,
    });
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
    let state = createActiveWorkoutState(startedAt, completionKey);

    state = addExercise(state, 0, "first");
    state = addExercise(state, 0, "duplicate");

    expect(state.exercises).toHaveLength(1);
    expect(state.error).toMatch(/already in this workout/i);
  });

  it("copies the prior set values and always retains one set", () => {
    let state = addExercise(createActiveWorkoutState(startedAt, completionKey));

    for (const [field, value] of [
      ["weightKg", "82.5"],
      ["repetitions", "8"],
    ] as const) {
      state = activeWorkoutReducer(state, {
        type: "set-value-changed",
        exerciseId: "exercise",
        setId: "exercise-set-1",
        field,
        value,
      });
    }

    state = activeWorkoutReducer(state, {
      type: "set-added",
      exerciseId: "exercise",
      setId: "exercise-set-2",
    });

    expect(state.exercises[0].sets[1]).toMatchObject({
      weightKg: "82.5",
      repetitions: "8",
      completedAt: null,
    });

    state = activeWorkoutReducer(state, {
      type: "set-removed",
      exerciseId: "exercise",
      setId: "exercise-set-2",
    });
    state = activeWorkoutReducer(state, {
      type: "set-removed",
      exerciseId: "exercise",
      setId: "exercise-set-1",
    });

    expect(state.exercises[0].sets).toHaveLength(1);
  });

  it("validates set values before marking a set complete", () => {
    let state = addExercise(createActiveWorkoutState(startedAt, completionKey));

    state = activeWorkoutReducer(state, {
      type: "set-completion-toggled",
      exerciseId: "exercise",
      setId: "exercise-set-1",
      completedAt: "2026-07-06T10:20:00Z",
    });

    expect(state.exercises[0].sets[0].completedAt).toBeNull();
    expect(state.exercises[0].sets[0].showValidation).toBe(true);

    for (const [field, value] of [
      ["weightKg", "100.123"],
      ["repetitions", "5"],
    ] as const) {
      state = activeWorkoutReducer(state, {
        type: "set-value-changed",
        exerciseId: "exercise",
        setId: "exercise-set-1",
        field,
        value,
      });
    }
    state = activeWorkoutReducer(state, {
      type: "set-completion-toggled",
      exerciseId: "exercise",
      setId: "exercise-set-1",
      completedAt: "2026-07-06T10:20:00Z",
    });

    expect(state.exercises[0].sets[0].completedAt).toBe("2026-07-06T10:20:00Z");
  });

  it("calculates planned and completed volume from valid sets", () => {
    const state: ActiveWorkoutState = {
      ...createActiveWorkoutState(startedAt, completionKey),
      exercises: [
        {
          id: "exercise",
          exerciseCode: "back-squat",
          displayName: "Back Squat",
          notes: "",
          sets: [
            {
              id: "set-1",
              previous: null,
              weightKg: "100",
              repetitions: "5",
              completedAt: "2026-07-06T10:20:00Z",
              notes: "",
              showValidation: false,
            },
            {
              id: "set-2",
              previous: null,
              weightKg: "80",
              repetitions: "10",
              completedAt: null,
              notes: "",
              showValidation: false,
            },
            {
              id: "invalid",
              previous: null,
              weightKg: "",
              repetitions: "",
              completedAt: null,
              notes: "",
              showValidation: false,
            },
          ],
        },
      ],
    };

    expect(calculateWorkoutVolume(state)).toEqual({
      planned: 1300,
      completed: 500,
    });
  });

  it("blocks completion until a valid set is completed", () => {
    let state = createActiveWorkoutState(startedAt, completionKey);

    state = activeWorkoutReducer(state, { type: "completion-requested" });
    expect(state.error).toMatch(/add at least one exercise/i);

    state = addExercise(state);
    state = activeWorkoutReducer(state, { type: "completion-requested" });

    expect(state.error).toMatch(/correct the highlighted set values/i);
    expect(state.status).toBe("editing");
  });

  it("represents saving, correlated error, and completed states", () => {
    const stateWithCompletedSet: ActiveWorkoutState = {
      ...createActiveWorkoutState(startedAt, completionKey),
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
              previous: null,
              weightKg: "100",
              repetitions: "5",
              completedAt: "2026-07-06T10:20:00Z",
              notes: "",
              showValidation: false,
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
      requestId: "request-id",
    });
    expect(failed.status).toBe("editing");
    expect(failed.error).toBe("Workout could not be saved.");
    expect(failed.requestId).toBe("request-id");
    expect(failed.completionKey).toBe(completionKey);

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

  it("restores a durable draft without transient completion state", () => {
    const initial = createActiveWorkoutState(
      "2026-07-06T11:00:00Z",
      "new-completion-key",
    );
    const recovered = activeWorkoutReducer(initial, {
      type: "draft-recovered",
      draft: {
        startedAt,
        completionKey,
        notes: "Recovered session",
        exercises: [
          {
            id: "exercise",
            exerciseCode: "back-squat",
            displayName: "Back Squat",
            notes: "",
            sets: [
              {
                id: "set",
                previous: null,
                weightKg: "100",
                repetitions: "5",
                completedAt: null,
                notes: "",
                showValidation: false,
              },
            ],
          },
        ],
      },
    });

    expect(recovered.startedAt).toBe(startedAt);
    expect(recovered.completionKey).toBe(completionKey);
    expect(recovered.notes).toBe("Recovered session");
    expect(recovered.status).toBe("editing");
    expect(recovered.dirty).toBe(true);
    expect(recovered.error).toBeNull();
  });
});
