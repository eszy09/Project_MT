import type { Metadata } from "next";
import { createHash, randomUUID } from "node:crypto";
import { redirect } from "next/navigation";
import { requireSession } from "@/features/auth";
import { ActiveWorkoutScreen } from "@/features/workouts";
import { getOnboardingDraft, getRoutine } from "@/services";

export const metadata: Metadata = {
  title: "Active workout",
  description: "Build and log an active strength-training workout.",
};

export default async function ActiveWorkoutPage({
  searchParams,
}: {
  searchParams: Promise<{ routineId?: string }>;
}) {
  const session = await requireSession("/workouts/active");
  const profile = await getOnboardingDraft();

  if (!profile?.completed) {
    redirect("/onboarding");
  }
  const { routineId } = await searchParams;
  const startedAt = new Date().toISOString();
  const completionKey = randomUUID();
  const routine = routineId ? await getRoutine(routineId) : null;
  const initialDraft = routine
    ? {
        startedAt,
        completionKey,
        notes: routine.name ? `Started from ${routine.name}` : "",
        exercises:
          routine.exercises?.map((exercise) => ({
            id: randomUUID(),
            exerciseCode: exercise.exerciseCode ?? "",
            displayName: exercise.displayName ?? "",
            notes: exercise.notes ?? "",
            previousSets: [],
            previousStatus: "loading" as const,
            sets:
              exercise.sets?.map((set) => ({
                id: randomUUID(),
                previous: null,
                weightKg:
                  set.targetWeightKg === undefined
                    ? ""
                    : String(set.targetWeightKg),
                repetitions: String(set.targetRepetitions ?? ""),
                completedAt: null,
                notes: set.notes ?? "",
                showValidation: false,
              })) ?? [],
          })) ?? [],
      }
    : undefined;

  return (
    <ActiveWorkoutScreen
      startedAt={startedAt}
      completionKey={completionKey}
      initialDraft={initialDraft}
      draftOwnerKey={createHash("sha256")
        .update(session.user.sub)
        .digest("hex")
        .slice(0, 32)}
    />
  );
}
