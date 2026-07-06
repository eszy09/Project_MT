"use server";

import { requireSession } from "@/features/auth";
import {
  WorkoutApiError,
  getWorkoutDetail,
  getWorkoutHistory,
  type WorkoutDetail,
  type WorkoutHistoryPage,
} from "@/services";

type HistoryFilters = {
  exerciseCode?: string;
  from?: string;
  to?: string;
};

export async function loadWorkoutHistoryAction(
  filters: HistoryFilters,
  cursor: string,
): Promise<
  | { success: true; page: WorkoutHistoryPage }
  | { success: false; error: string; requestId: string | null }
> {
  await requireSession("/workouts/history");
  try {
    return {
      success: true,
      page: await getWorkoutHistory({ ...filters, cursor }),
    };
  } catch (error) {
    return failure(error);
  }
}

export async function loadWorkoutDetailAction(
  workoutId: string,
): Promise<
  | { success: true; workout: WorkoutDetail }
  | { success: false; error: string; requestId: string | null }
> {
  await requireSession("/workouts/history");
  try {
    return { success: true, workout: await getWorkoutDetail(workoutId) };
  } catch (error) {
    return failure(error);
  }
}

function failure(error: unknown) {
  if (error instanceof WorkoutApiError) {
    return {
      success: false as const,
      error: error.message,
      requestId: error.requestId,
    };
  }
  return {
    success: false as const,
    error: "Workout history could not be loaded. Try again.",
    requestId: null,
  };
}
