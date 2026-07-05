import { redirect } from "next/navigation";
import { requireSession } from "@/features/auth";
import { OnboardingFlow } from "@/features/onboarding";
import { getOnboardingDraft } from "@/services";

type Step = 1 | 2 | 3 | 4;

export default async function OnboardingPage({
  searchParams,
}: {
  searchParams: Promise<{ step?: string }>;
}) {
  const session = await requireSession("/onboarding");
  const draft = await getOnboardingDraft();

  if (draft?.completed) {
    redirect("/dashboard");
  }

  const { step: rawStep } = await searchParams;
  const requestedStep = Number(rawStep);
  const availableStep = Math.min(draft?.onboardingStep ?? 1, 4);
  const step = (
    Number.isInteger(requestedStep) &&
    requestedStep >= 1 &&
    requestedStep <= availableStep
      ? requestedStep
      : availableStep
  ) as Step;
  const fallbackDisplayName = session.user.name ?? session.user.nickname ?? "";

  return (
    <OnboardingFlow
      draft={draft}
      fallbackDisplayName={fallbackDisplayName}
      step={step}
    />
  );
}
