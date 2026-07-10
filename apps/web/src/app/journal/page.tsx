import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { requireSession } from "@/features/auth";
import { JournalScreen } from "@/features/journal";
import { getOnboardingDraft } from "@/services";

export const metadata: Metadata = {
  title: "Journal",
  description: "Capture private training notes and media context.",
};

export default async function JournalPage() {
  await requireSession("/journal");
  const profile = await getOnboardingDraft();
  if (!profile?.completed) redirect("/onboarding");

  return <JournalScreen />;
}
