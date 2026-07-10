import Link from "next/link";
import { redirect } from "next/navigation";
import { PageHeader, StatCard, Surface } from "@/components";
import { requireSession } from "@/features/auth";
import { BodyAvatarHero, buildAvatarSignals } from "@/features/body-model";
import { primaryGoalLabel, targetAreaLabel } from "@/features/onboarding";
import { getLatestBodyCheckin, getOnboardingDraft } from "@/services";
import type { BodyCheckin } from "@/services";

export default async function DashboardPage() {
  await requireSession("/dashboard");
  const profile = await getOnboardingDraft();

  if (!profile?.completed || !profile.primaryGoal) {
    redirect("/onboarding");
  }

  const targetAreas = profile.targetAreas.map(targetAreaLabel);
  const targetAreaSummary = targetAreas.join(", ").toLowerCase();
  const primaryGoal = primaryGoalLabel(profile.primaryGoal);

  let latestCheckin: BodyCheckin | null = null;
  try {
    latestCheckin = await getLatestBodyCheckin();
  } catch {
    latestCheckin = null;
  }

  const avatarSignals = buildAvatarSignals({ profile, latestCheckin });

  return (
    <section className="w-full">
      <PageHeader
        eyebrow="Dashboard"
        title={`Welcome, ${profile.displayName}`}
        description="Your training hub is ready. The avatar, check-ins, and workouts now share one clean control surface."
      >
        <Surface className="min-w-64 p-5" tone="active">
          <p className="text-sm font-black text-lime-100">Today</p>
          <p className="mt-2 text-3xl font-black tracking-tight text-white">
            Train or check in
          </p>
        </Surface>
      </PageHeader>

      <BodyAvatarHero
        displayName={profile.displayName}
        primaryGoal={primaryGoal}
        targetAreaSummary={targetAreaSummary}
        targetAreaLabels={targetAreas}
        avatarSignals={avatarSignals}
      />

      <div className="mt-5 grid gap-4 md:grid-cols-3">
        <StatCard
          label="Goal"
          value={primaryGoal}
          detail="Current training intent."
        />
        <StatCard
          label="Focus"
          value={targetAreas.length.toString()}
          detail="Target areas selected."
          accent="violet"
        />
        <StatCard
          label="Avatar"
          value={avatarSignals.readiness.label}
          detail="Measurement baseline status."
          accent="cyan"
        />
      </div>

      <CheckinDashboardCard latestCheckin={latestCheckin} />

      <div className="mt-5 grid gap-4 lg:grid-cols-5">
        <QuickAction href="/workouts/active" label="Start workout" />
        <QuickAction href="/check-ins/new" label="Log check-in" />
        <QuickAction href="/progress" label="View progress" />
        <QuickAction href="/journal" label="Open journal" />
        <QuickAction href="/settings" label="Settings" />
      </div>
    </section>
  );
}

function CheckinDashboardCard({
  latestCheckin,
}: {
  latestCheckin: BodyCheckin | null;
}) {
  return (
    <Surface className="mt-5 p-5 sm:p-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-xs font-black tracking-[0.18em] text-lime-200 uppercase">
            Check-in controlled dashboard
          </p>
          <h2 className="mt-2 text-3xl font-black tracking-tight">
            {latestCheckin ? "Latest body signal" : "No check-in yet"}
          </h2>
        </div>
        <Link
          href="/check-ins/new"
          className="inline-flex min-h-11 items-center justify-center rounded-2xl bg-lime-300 px-4 py-2 text-sm font-black text-slate-950 transition hover:bg-lime-200"
        >
          {latestCheckin ? "Update check-in" : "Add first check-in"}
        </Link>
      </div>

      <div className="mt-5 grid gap-3 sm:grid-cols-3">
        <MiniMetric
          label="Measured"
          value={
            latestCheckin?.measuredAt
              ? formatDate(latestCheckin.measuredAt)
              : "Pending"
          }
        />
        <MiniMetric
          label="Weight"
          value={formatMeasurement(latestCheckin?.weight)}
        />
        <MiniMetric
          label="Waist"
          value={formatMeasurement(latestCheckin?.waist)}
        />
      </div>
    </Surface>
  );
}

function MiniMetric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.025] p-4">
      <p className="text-xs font-black tracking-[0.16em] text-slate-500 uppercase">
        {label}
      </p>
      <p className="mt-2 text-2xl font-black tracking-tight">{value}</p>
    </div>
  );
}

function QuickAction({ href, label }: { href: string; label: string }) {
  return (
    <Link href={href} className="group block">
      <Surface className="flex min-h-24 items-end transition group-hover:-translate-y-0.5 group-hover:border-lime-300/25">
        <span className="text-xl font-black tracking-tight">{label}</span>
      </Surface>
    </Link>
  );
}

function formatMeasurement(value?: { value?: number; unit?: string }) {
  return value?.value ? `${value.value} ${value.unit ?? ""}`.trim() : "Not set";
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat("en", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(new Date(value));
}
