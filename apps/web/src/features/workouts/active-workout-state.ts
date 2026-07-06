import type { ExerciseCatalogItem } from "./exercise-catalog";

export type WorkoutSetDraft = {
  id: string;
  weightKg: string;
  repetitions: string;
  completedAt: string | null;
  notes: string;
};

export type WorkoutExerciseDraft = {
  id: string;
  exerciseCode: string;
  displayName: string;
  notes: string;
  sets: WorkoutSetDraft[];
};

export type CompletedWorkoutSummary = {
  id: string;
  durationSeconds: number;
  exerciseCount: number;
  completedSetCount: number;
};

export type ActiveWorkoutState = {
  startedAt: string;
  notes: string;
  exercises: WorkoutExerciseDraft[];
  status: "editing" | "saving" | "completed";
  dirty: boolean;
  error: string | null;
  completedWorkout: CompletedWorkoutSummary | null;
};

export type ActiveWorkoutAction =
  | {
      type: "exercise-added";
      exercise: ExerciseCatalogItem;
      id: string;
    }
  | { type: "exercise-removed"; id: string }
  | {
      type: "exercise-moved";
      id: string;
      direction: "up" | "down";
    }
  | { type: "notes-changed"; notes: string }
  | { type: "completion-requested" }
  | { type: "save-started" }
  | { type: "save-failed"; message: string }
  | {
      type: "save-completed";
      workout: CompletedWorkoutSummary;
    }
  | { type: "error-dismissed" }
  | { type: "discarded"; startedAt: string };

export function createActiveWorkoutState(
  startedAt: string,
): ActiveWorkoutState {
  return {
    startedAt,
    notes: "",
    exercises: [],
    status: "editing",
    dirty: false,
    error: null,
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
            sets: [],
          },
        ],
        dirty: true,
        error: null,
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
      };
    }

    case "notes-changed":
      return {
        ...state,
        notes: action.notes,
        dirty: true,
      };

    case "completion-requested": {
      if (state.exercises.length === 0) {
        return {
          ...state,
          error: "Add at least one exercise before completing your workout.",
        };
      }

      const completedSetCount = state.exercises.reduce(
        (total, exercise) =>
          total +
          exercise.sets.filter((set) => set.completedAt !== null).length,
        0,
      );

      if (completedSetCount === 0) {
        return {
          ...state,
          error: "Complete at least one set before finishing your workout.",
        };
      }

      return {
        ...state,
        status: "saving",
        error: null,
      };
    }

    case "save-started":
      return {
        ...state,
        status: "saving",
        error: null,
      };

    case "save-failed":
      return {
        ...state,
        status: "editing",
        error: action.message,
      };

    case "save-completed":
      return {
        ...state,
        status: "completed",
        dirty: false,
        error: null,
        completedWorkout: action.workout,
      };

    case "error-dismissed":
      return {
        ...state,
        error: null,
      };

    case "discarded":
      return createActiveWorkoutState(action.startedAt);
  }
}
