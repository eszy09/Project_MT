import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { requireSession } from "@/features/auth";
import { WorkoutHistoryScreen } from "@/features/workouts/workout-history-screen";
import {
  WorkoutApiError,
  getOnboardingDraft,
  getWorkoutHistory,
} from "@/services";

export const metadata: Metadata = {
  title: "Workout history",
  description: "Review completed workouts and training performance.",
};

export default async function WorkoutHistoryPage({
  searchParams,
}: {
  searchParams: Promise<{
    exercise?: string;
    from?: string;
    to?: string;
  }>;
}) {
  await requireSession("/workouts/history");
  const profile = await getOnboardingDraft();
  if (!profile?.completed) redirect("/onboarding");

  const parameters = await searchParams;
  const filters = {
    exerciseCode: parameters.exercise || undefined,
    from: parameters.from ? `${parameters.from}T00:00:00.000Z` : undefined,
    to: parameters.to ? `${parameters.to}T23:59:59.999Z` : undefined,
  };

  let initialPage;
  let initialError: { message: string; requestId: string | null } | null = null;

  try {
    initialPage = await getWorkoutHistory(filters);
  } catch (error) {
    initialPage = { items: [] };
    initialError =
      error instanceof WorkoutApiError
        ? { message: error.message, requestId: error.requestId }
        : {
            message: "Workout history could not be loaded.",
            requestId: null,
          };
  }

  return (
    <WorkoutHistoryScreen
      initialPage={initialPage}
      filters={filters}
      formValues={parameters}
      initialError={initialError}
    />
  );
}
