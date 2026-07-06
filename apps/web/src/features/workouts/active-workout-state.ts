import type { ExerciseCatalogItem } from "./exercise-catalog";

export type PreviousSetPerformance = {
  position: number;
  weightKg: string;
  repetitions: string;
};

export type WorkoutSetDraft = {
  id: string;
  previous: PreviousSetPerformance | null;
  weightKg: string;
  repetitions: string;
  completedAt: string | null;
  notes: string;
  showValidation: boolean;
};

export type WorkoutExerciseDraft = {
  id: string;
  exerciseCode: string;
  displayName: string;
  notes: string;
  sets: WorkoutSetDraft[];
  previousSets?: PreviousSetPerformance[];
  previousStatus?: "loading" | "loaded" | "empty" | "error";
};

export type CompletedWorkoutSummary = {
  id: string;
  durationSeconds: number;
  exerciseCount: number;
  completedSetCount: number;
};

export type ActiveWorkoutState = {
  startedAt: string;
  completionKey: string;
  notes: string;
  exercises: WorkoutExerciseDraft[];
  status: "editing" | "saving" | "completed";
  dirty: boolean;
  error: string | null;
  requestId: string | null;
  completedWorkout: CompletedWorkoutSummary | null;
};

export type ActiveWorkoutAction =
  | {
      type: "exercise-added";
      exercise: ExerciseCatalogItem;
      id: string;
      setId: string;
    }
  | { type: "exercise-removed"; id: string }
  | {
      type: "exercise-moved";
      id: string;
      direction: "up" | "down";
    }
  | {
      type: "set-added";
      exerciseId: string;
      setId: string;
    }
  | { type: "previous-performance-loading"; exerciseId: string }
  | {
      type: "previous-performance-loaded";
      exerciseId: string;
      sets: PreviousSetPerformance[];
    }
  | { type: "previous-performance-failed"; exerciseId: string }
  | {
      type: "previous-values-copied";
      exerciseId: string;
      setId: string;
    }
  | {
      type: "set-removed";
      exerciseId: string;
      setId: string;
    }
  | {
      type: "set-value-changed";
      exerciseId: string;
      setId: string;
      field: "weightKg" | "repetitions";
      value: string;
    }
  | {
      type: "set-notes-changed";
      exerciseId: string;
      setId: string;
      notes: string;
    }
  | {
      type: "set-completion-toggled";
      exerciseId: string;
      setId: string;
      completedAt: string;
    }
  | { type: "notes-changed"; notes: string }
  | { type: "completion-requested" }
  | { type: "save-started" }
  | {
      type: "save-failed";
      message: string;
      requestId: string | null;
    }
  | {
      type: "save-completed";
      workout: CompletedWorkoutSummary;
    }
  | {
      type: "draft-recovered";
      draft: Pick<
        ActiveWorkoutState,
        "startedAt" | "completionKey" | "notes" | "exercises"
      >;
    }
  | { type: "error-dismissed" }
  | {
      type: "discarded";
      startedAt: string;
      completionKey: string;
    };

export type SetValidation = {
  weightKg: string | null;
  repetitions: string | null;
};

export function createActiveWorkoutState(
  startedAt: string,
  completionKey: string,
): ActiveWorkoutState {
  return {
    startedAt,
    completionKey,
    notes: "",
    exercises: [],
    status: "editing",
    dirty: false,
    error: null,
    requestId: null,
    completedWorkout: null,
  };
}

export function activeWorkoutReducer(
  state: ActiveWorkoutState,
  action: ActiveWorkoutAction,
): ActiveWorkoutState {
  switch (action.type) {
    case "exercise-added": {
      const alreadyAdded = state.exercises.some(
        (exercise) => exercise.exerciseCode === action.exercise.code,
      );

      if (alreadyAdded) {
        return {
          ...state,
          error: `${action.exercise.name} is already in this workout.`,
          requestId: null,
        };
      }

      return {
        ...state,
        exercises: [
          ...state.exercises,
          {
            id: action.id,
            exerciseCode: action.exercise.code,
            displayName: action.exercise.name,
            notes: "",
            sets: [blankSet(action.setId)],
            previousSets: [],
            previousStatus: "loading",
          },
        ],
        dirty: true,
        error: null,
        requestId: null,
      };
    }

    case "exercise-removed":
      return {
        ...state,
        exercises: state.exercises.filter(
          (exercise) => exercise.id !== action.id,
        ),
        dirty: true,
        error: null,
        requestId: null,
      };

    case "exercise-moved": {
      const currentIndex = state.exercises.findIndex(
        (exercise) => exercise.id === action.id,
      );
      const targetIndex =
        action.direction === "up" ? currentIndex - 1 : currentIndex + 1;

      if (
        currentIndex < 0 ||
        targetIndex < 0 ||
        targetIndex >= state.exercises.length
      ) {
        return state;
      }

      const exercises = [...state.exercises];
      [exercises[currentIndex], exercises[targetIndex]] = [
        exercises[targetIndex],
        exercises[currentIndex],
      ];

      return {
        ...state,
        exercises,
        dirty: true,
        error: null,
        requestId: null,
      };
    }

    case "set-added":
      return updateExercise(state, action.exerciseId, (exercise) => {
        const previousSet = exercise.sets.at(-1);
        const position = exercise.sets.length + 1;

        return {
          ...exercise,
          sets: [
            ...exercise.sets,
            {
              ...blankSet(action.setId),
              weightKg: previousSet?.weightKg ?? "",
              repetitions: previousSet?.repetitions ?? "",
              previous:
                exercise.previousSets?.find(
                  (candidate) => candidate.position === position,
                ) ?? null,
            },
          ],
        };
      });

    case "previous-performance-loading":
      return updateExercise(state, action.exerciseId, (exercise) => ({
        ...exercise,
        previousStatus: "loading",
      }));

    case "previous-performance-loaded":
      return updateExercise(state, action.exerciseId, (exercise) => ({
        ...exercise,
        previousSets: action.sets,
        previousStatus: action.sets.length > 0 ? "loaded" : "empty",
        sets: exercise.sets.map((set, index) => ({
          ...set,
          previous:
            action.sets.find((candidate) => candidate.position === index + 1) ??
            null,
        })),
      }));

    case "previous-performance-failed":
      return updateExercise(state, action.exerciseId, (exercise) => ({
        ...exercise,
        previousStatus: "error",
      }));

    case "previous-values-copied":
      return updateSet(state, action.exerciseId, action.setId, (set) =>
        set.previous
          ? {
              ...set,
              weightKg: set.previous.weightKg,
              repetitions: set.previous.repetitions,
              completedAt: null,
            }
          : set,
      );

    case "set-removed":
      return updateExercise(state, action.exerciseId, (exercise) => {
        if (exercise.sets.length === 1) {
          return exercise;
        }

        return {
          ...exercise,
          sets: exercise.sets.filter((set) => set.id !== action.setId),
        };
      });

    case "set-value-changed":
      return updateSet(state, action.exerciseId, action.setId, (set) => {
        const updated = {
          ...set,
          [action.field]: action.value,
        };

        return {
          ...updated,
          completedAt: isSetValid(updated) ? set.completedAt : null,
        };
      });

    case "set-notes-changed":
      return updateSet(state, action.exerciseId, action.setId, (set) => ({
        ...set,
        notes: action.notes,
      }));

    case "set-completion-toggled":
      return updateSet(state, action.exerciseId, action.setId, (set) => {
        if (set.completedAt !== null) {
          return {
            ...set,
            completedAt: null,
          };
        }

        if (!isSetValid(set)) {
          return {
            ...set,
            showValidation: true,
          };
        }

        return {
          ...set,
          completedAt: action.completedAt,
          showValidation: true,
        };
      });

    case "notes-changed":
      return {
        ...state,
        notes: action.notes,
        dirty: true,
      };

    case "completion-requested": {
      const exercises = state.exercises.map((exercise) => ({
        ...exercise,
        sets: exercise.sets.map((set) => ({
          ...set,
          showValidation: true,
        })),
      }));
      const error = workoutCompletionError({
        ...state,
        exercises,
      });

      return {
        ...state,
        exercises,
        status: error ? "editing" : "saving",
        error,
        requestId: null,
      };
    }

    case "save-started":
      return {
        ...state,
        status: "saving",
        error: null,
        requestId: null,
      };

    case "save-failed":
      return {
        ...state,
        status: "editing",
        error: action.message,
        requestId: action.requestId,
      };

    case "save-completed":
      return {
        ...state,
        status: "completed",
        dirty: false,
        error: null,
        requestId: null,
        completedWorkout: action.workout,
      };

    case "draft-recovered":
      return {
        ...state,
        ...action.draft,
        status: "editing",
        dirty: true,
        error: null,
        requestId: null,
        completedWorkout: null,
      };

    case "error-dismissed":
      return {
        ...state,
        error: null,
        requestId: null,
      };

    case "discarded":
      return createActiveWorkoutState(action.startedAt, action.completionKey);
  }
}

export function validateSet(set: WorkoutSetDraft): SetValidation {
  return {
    weightKg: validateWeight(set.weightKg),
    repetitions: validateRepetitions(set.repetitions),
  };
}

export function isSetValid(set: WorkoutSetDraft) {
  const validation = validateSet(set);
  return validation.weightKg === null && validation.repetitions === null;
}

export function workoutCompletionError(state: ActiveWorkoutState) {
  if (state.exercises.length === 0) {
    return "Add at least one exercise before completing your workout.";
  }

  const allSets = state.exercises.flatMap((exercise) => exercise.sets);

  if (allSets.some((set) => !isSetValid(set))) {
    return "Correct the highlighted set values before completing your workout.";
  }

  if (allSets.every((set) => set.completedAt === null)) {
    return "Complete at least one set before finishing your workout.";
  }

  return null;
}

export function calculateWorkoutVolume(state: ActiveWorkoutState) {
  return state.exercises
    .flatMap((exercise) => exercise.sets)
    .reduce(
      (volume, set) => {
        if (!isSetValid(set)) {
          return volume;
        }

        const setVolume = Number(set.weightKg) * Number(set.repetitions);

        return {
          planned: volume.planned + setVolume,
          completed:
            volume.completed + (set.completedAt === null ? 0 : setVolume),
        };
      },
      { planned: 0, completed: 0 },
    );
}

function blankSet(id: string): WorkoutSetDraft {
  return {
    id,
    previous: null,
    weightKg: "",
    repetitions: "",
    completedAt: null,
    notes: "",
    showValidation: false,
  };
}

function updateExercise(
  state: ActiveWorkoutState,
  exerciseId: string,
  update: (exercise: WorkoutExerciseDraft) => WorkoutExerciseDraft,
) {
  return {
    ...state,
    exercises: state.exercises.map((exercise) =>
      exercise.id === exerciseId ? update(exercise) : exercise,
    ),
    dirty: true,
    error: null,
    requestId: null,
  };
}

function updateSet(
  state: ActiveWorkoutState,
  exerciseId: string,
  setId: string,
  update: (set: WorkoutSetDraft) => WorkoutSetDraft,
) {
  return updateExercise(state, exerciseId, (exercise) => ({
    ...exercise,
    sets: exercise.sets.map((set) => (set.id === setId ? update(set) : set)),
  }));
}

function validateWeight(value: string) {
  if (!value.trim()) {
    return "Enter weight.";
  }

  if (!/^(?:\d+(?:\.\d{0,3})?|\.\d{1,3})$/.test(value)) {
    return "Use up to three decimal places.";
  }

  const weight = Number(value);
  return weight >= 0 && weight <= 2000
    ? null
    : "Weight must be between 0 and 2000 kg.";
}

function validateRepetitions(value: string) {
  if (!value.trim()) {
    return "Enter repetitions.";
  }

  if (!/^\d+$/.test(value)) {
    return "Repetitions must be a whole number.";
  }

  const repetitions = Number(value);
  return repetitions >= 1 && repetitions <= 1000
    ? null
    : "Repetitions must be between 1 and 1000.";
}
