import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { CheckinForm } from "@/features/checkins";
import { requireSession } from "@/features/auth";
import { getOnboardingDraft } from "@/services";

export const metadata: Metadata = {
  title: "New check-in",
  description: "Record body measurements and notes for progress tracking.",
};

export default async function NewCheckinPage() {
  await requireSession("/check-ins/new");
  const profile = await getOnboardingDraft();
  if (!profile?.completed) redirect("/onboarding");

  return <CheckinForm defaultMeasuredAt={defaultLocalDateTime()} />;
}

function defaultLocalDateTime() {
  return new Date().toISOString().slice(0, 16);
}
