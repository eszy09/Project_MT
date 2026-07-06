import type { Metadata } from "next";
import { createHash, randomUUID } from "node:crypto";
import { redirect } from "next/navigation";
import { requireSession } from "@/features/auth";
import { ActiveWorkoutScreen } from "@/features/workouts";
import { getOnboardingDraft } from "@/services";

export const metadata: Metadata = {
  title: "Active workout",
  description: "Build and log an active strength-training workout.",
};

export default async function ActiveWorkoutPage() {
  const session = await requireSession("/workouts/active");
  const profile = await getOnboardingDraft();

  if (!profile?.completed) {
    redirect("/onboarding");
  }

  return (
    <ActiveWorkoutScreen
      startedAt={new Date().toISOString()}
      completionKey={randomUUID()}
      draftOwnerKey={createHash("sha256")
        .update(session.user.sub)
        .digest("hex")
        .slice(0, 32)}
    />
  );
}
