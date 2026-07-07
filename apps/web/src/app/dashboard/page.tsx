import Link from "next/link";
import { redirect } from "next/navigation";
import { Badge, PageHeader, StatCard, Surface, cn } from "@/components";
import { requireSession } from "@/features/auth";
import { primaryGoalLabel, targetAreaLabel } from "@/features/onboarding";
import { getOnboardingDraft } from "@/services";

const tabs = ["Overview", "Workout", "Check-ins", "Progress", "Journal"];

const nextActions = [
  {
    label: "Start workout",
    href: "/workouts/active",
    detail: "Log sets while the session is live.",
    tone: "lime",
  },
  {
    label: "Log check-in",
    href: "/progress",
    detail: "Record body context and visual progress.",
    tone: "violet",
  },
  {
    label: "Build routine",
    href: "/routines",
    detail: "Create reusable training structure.",
    tone: "cyan",
  },
];

export default async function DashboardPage() {
  await requireSession("/dashboard");
  const profile = await getOnboardingDraft();

  if (!profile?.completed || !profile.primaryGoal) {
    redirect("/onboarding");
  }

  const targetAreas = profile.targetAreas.map(targetAreaLabel);
  const targetAreaSummary = targetAreas.join(", ").toLowerCase();

  return (
    <section className="w-full">
      <PageHeader
        eyebrow="Command center"
        title={`Welcome, ${profile.displayName}`}
        description={`Your starting point is saved. Project_MT can now shape training around ${primaryGoalLabel(profile.primaryGoal).toLowerCase()} with priority on ${targetAreaSummary}.`}
      >
        <Surface className="min-w-72 p-5" tone="active">
          <p className="text-sm font-bold text-lime-100">Readiness</p>
          <p className="mt-3 text-4xl font-black tracking-tight text-white">
            Setup live
          </p>
          <p className="mt-2 text-sm text-slate-300">
            Onboarding complete. Training data can start compounding now.
          </p>
        </Surface>
      </PageHeader>

      <nav
        aria-label="Dashboard sections"
        className="mt-10 flex gap-2 overflow-x-auto rounded-3xl border border-white/10 bg-white/[0.035] p-2"
      >
        {tabs.map((tab, index) => (
          <span
            key={tab}
            className={cn(
              "shrink-0 rounded-2xl px-4 py-2 text-sm font-bold",
              index === 0
                ? "bg-lime-300 text-slate-950 shadow-lg shadow-lime-500/15"
                : "text-slate-300",
            )}
          >
            {tab}
          </span>
        ))}
      </nav>

      <div className="mt-6 grid gap-5 lg:grid-cols-[1.35fr_0.65fr]">
        <Surface tone="active" className="relative overflow-hidden p-7">
          <div className="absolute -top-24 -right-20 size-72 rounded-full bg-lime-300/10 blur-3xl" />
          <div className="absolute -bottom-28 left-20 size-72 rounded-full bg-violet-500/15 blur-3xl" />

          <div className="relative">
            <Badge>Recommended next step</Badge>
            <h2 className="mt-5 max-w-2xl text-4xl font-black tracking-[-0.04em]">
              Log your first workout and establish your baseline.
            </h2>
            <p className="mt-4 max-w-2xl text-lg leading-8 text-slate-300">
              Build a focused session with exercises that emphasize{" "}
              {targetAreaSummary}. This gives the dashboard real performance
              data to compare against later.
            </p>

            <div className="mt-7 flex flex-wrap gap-3">
              <Link
                href="/workouts/active"
                className="inline-flex min-h-12 items-center justify-center rounded-2xl bg-lime-300 px-6 py-3 text-sm font-black text-slate-950 shadow-lg shadow-lime-500/20 transition hover:bg-lime-200"
              >
                Start workout
              </Link>
              <Link
                href="/workouts/history"
                className="inline-flex min-h-12 items-center justify-center rounded-2xl border border-violet-300/30 bg-violet-400/10 px-6 py-3 text-sm font-bold text-violet-100 transition hover:bg-violet-400/15"
              >
                View history
              </Link>
              <Link
                href="/routines"
                className="inline-flex min-h-12 items-center justify-center rounded-2xl border border-white/15 bg-white/[0.03] px-6 py-3 text-sm font-bold text-slate-100 transition hover:bg-white/10"
              >
                Manage routines
              </Link>
            </div>
          </div>
        </Surface>

        <Surface className="p-7">
          <p className="text-sm font-bold tracking-[0.18em] text-slate-400 uppercase">
            Athlete profile
          </p>
          <p className="mt-5 text-sm text-slate-400">Primary goal</p>
          <p className="mt-1 text-2xl font-black tracking-tight">
            {primaryGoalLabel(profile.primaryGoal)}
          </p>
          <p className="mt-6 text-sm text-slate-400">Target areas</p>
          <ul className="mt-3 flex flex-wrap gap-2">
            {profile.targetAreas.map((area) => (
              <li
                key={area}
                className="rounded-full border border-violet-300/20 bg-violet-400/10 px-3 py-1 text-sm font-bold text-violet-100"
              >
                {targetAreaLabel(area)}
              </li>
            ))}
          </ul>
        </Surface>
      </div>

      <div className="mt-5 grid gap-5 md:grid-cols-3">
        <StatCard
          label="Onboarding"
          value="100%"
          detail="The first profile pass is complete and ready to drive recommendations."
        />
        <StatCard
          label="Workout"
          value="Next"
          detail="Start collecting set-level data for progressive overload."
          accent="violet"
        />
        <StatCard
          label="Check-in"
          value="Due"
          detail="Add measurements or media to anchor visual progress."
          accent="orange"
        />
      </div>

      <div className="mt-5 grid gap-5 lg:grid-cols-3">
        {nextActions.map((action) => (
          <Link key={action.label} href={action.href} className="group block">
            <Surface className="h-full transition group-hover:-translate-y-0.5 group-hover:border-lime-300/25">
              <div
                className={cn(
                  "mb-5 size-11 rounded-2xl border",
                  action.tone === "lime" && "border-lime-300/30 bg-lime-300/15",
                  action.tone === "violet" &&
                    "border-violet-300/30 bg-violet-400/15",
                  action.tone === "cyan" && "border-cyan-300/30 bg-cyan-400/15",
                )}
              />
              <h3 className="text-xl font-black tracking-tight">
                {action.label}
              </h3>
              <p className="mt-3 leading-7 text-slate-300">{action.detail}</p>
            </Surface>
          </Link>
        ))}
      </div>
    </section>
  );
}
