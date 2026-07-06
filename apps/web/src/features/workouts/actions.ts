"use server";

import { requireSession } from "@/features/auth";
import {
  WorkoutApiError,
  getPreviousPerformance,
  saveCompletedWorkout,
  type WorkoutCompletionInput,
} from "@/services";

export type CompleteWorkoutActionInput = {
  completionKey: string;
  workout: WorkoutCompletionInput;
};

export type CompleteWorkoutActionResult =
  | {
      success: true;
      workout: {
        id: string;
        durationSeconds: number;
        exerciseCount: number;
        completedSetCount: number;
      };
    }
  | {
      success: false;
      error: string;
      requestId: string | null;
    };

export async function completeWorkoutAction(
  input: CompleteWorkoutActionInput,
): Promise<CompleteWorkoutActionResult> {
  await requireSession("/workouts/active");

  if (!/^[A-Za-z0-9][A-Za-z0-9._:-]{7,99}$/.test(input.completionKey)) {
    return {
      success: false,
      error: "The workout completion key is invalid. Start a new workout.",
      requestId: null,
    };
  }

  try {
    const workout = await saveCompletedWorkout(
      input.workout,
      input.completionKey,
    );

    return {
      success: true,
      workout: {
        id: workout.id,
        durationSeconds: workout.durationSeconds,
        exerciseCount: workout.exerciseCount,
        completedSetCount: workout.completedSetCount,
      },
    };
  } catch (error) {
    if (error instanceof WorkoutApiError) {
      return {
        success: false,
        error: error.message,
        requestId: error.requestId,
      };
    }

    return {
      success: false,
      error: "The workout could not be saved. Try again.",
      requestId: null,
    };
  }
}

export async function loadPreviousPerformanceAction(
  exerciseCode: string,
): Promise<
  | {
      success: true;
      sets: {
        position: number;
        weightKg: string;
        repetitions: string;
      }[];
    }
  | { success: false }
> {
  await requireSession("/workouts/active");

  try {
    const performance = await getPreviousPerformance(exerciseCode);
    return {
      success: true,
      sets:
        performance?.sets?.map((set) => ({
          position: set.position ?? 0,
          weightKg: String(set.weightKg ?? ""),
          repetitions: String(set.repetitions ?? ""),
        })) ?? [],
    };
  } catch {
    return { success: false };
  }
}
