import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { requireSession } from "@/features/auth";
import { buildAvatarSignals } from "@/features/body-model";
import { ProgressTrendsScreen, buildProgressTrends } from "@/features/progress";
import {
  ProgressApiError,
  getOnboardingDraft,
  getProgressSourceData,
} from "@/services";

export const metadata: Metadata = {
  title: "Progress trends",
  description:
    "Review accessible body-measurement and training-consistency trends.",
};

export default async function ProgressPage({
  searchParams,
}: {
  searchParams: Promise<{ days?: string }>;
}) {
  await requireSession("/progress");
  const profile = await getOnboardingDraft();
  if (!profile?.completed) redirect("/onboarding");

  const parameters = await searchParams;
  const selectedDays = parseDays(parameters.days);
  const to = new Date();
  const from = new Date(to.getTime() - (selectedDays - 1) * 86_400_000);
  let source = { checkins: [], workouts: [] } as Awaited<
    ReturnType<typeof getProgressSourceData>
  >;
  let error: { message: string; requestId: string | null } | null = null;

  try {
    source = await getProgressSourceData(from.toISOString(), to.toISOString());
  } catch (cause) {
    error =
      cause instanceof ProgressApiError
        ? { message: cause.message, requestId: cause.requestId }
        : {
            message: "Progress trends could not be loaded.",
            requestId: null,
          };
  }

  return (
    <ProgressTrendsScreen
      trends={buildProgressTrends(source.checkins, source.workouts, from, to)}
      selectedDays={selectedDays}
      avatarComparison={{
        current: buildAvatarSignals({
          profile,
          latestCheckin: source.checkins[0] ?? null,
        }),
        previous: source.checkins[1]
          ? buildAvatarSignals({ profile, latestCheckin: source.checkins[1] })
          : null,
      }}
      error={error}
    />
  );
}

function parseDays(value?: string) {
  const days = Number(value);
  return days === 30 || days === 180 ? days : 90;
}
