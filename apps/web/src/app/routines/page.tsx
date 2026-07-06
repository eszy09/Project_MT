import { redirect } from "next/navigation";
import { requireSession } from "@/features/auth";
import { RoutineManager } from "@/features/routines/routine-manager";
import { getOnboardingDraft, listRoutines } from "@/services";

export default async function RoutinesPage() {
  await requireSession("/routines");
  const profile = await getOnboardingDraft();
  if (!profile?.completed) redirect("/onboarding");
  return <RoutineManager initialRoutines={await listRoutines(true)} />;
}
