import Link from "next/link";
import { redirect } from "next/navigation";
import { Badge, PageHeader, StatCard, Surface, cn } from "@/components";
import { requireSession } from "@/features/auth";
import { BodyAvatarHero, buildAvatarSignals } from "@/features/body-model";
import { primaryGoalLabel, targetAreaLabel } from "@/features/onboarding";
import { getLatestBodyCheckin, getOnboardingDraft } from "@/services";
import type { BodyCheckin } from "@/services";

type DashboardTab =
  "overview" | "workout" | "check-ins" | "progress" | "journal";

const tabs: ReadonlyArray<{
  id: DashboardTab;
  label: string;
  description: string;
}> = [
  {
    id: "overview",
    label: "Overview",
    description: "A balanced command view across the product loops.",
  },
  {
    id: "workout",
    label: "Workout",
    description: "Start sessions, review history, and manage routines.",
  },
  {
    id: "check-ins",
    label: "Check-ins",
    description: "Record visual and body-context progress.",
  },
  {
    id: "progress",
    label: "Progress",
    description: "Review trend summaries and body model context.",
  },
  {
    id: "journal",
    label: "Journal",
    description: "Capture private training notes and media context.",
  },
];

const validTabs = new Set<DashboardTab>(tabs.map((tab) => tab.id));

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string }>;
}) {
  await requireSession("/dashboard");
  const profile = await getOnboardingDraft();

  if (!profile?.completed || !profile.primaryGoal) {
    redirect("/onboarding");
  }

  const parameters = await searchParams;
  const selectedTab = parseDashboardTab(parameters.tab);
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
        eyebrow="Avatar-first dashboard"
        title={`Welcome, ${profile.displayName}`}
        description={`Your starting point is saved. The avatar now becomes the visual anchor for ${primaryGoal.toLowerCase()}, check-ins, workouts, and progress context.`}
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

      <BodyAvatarHero
        displayName={profile.displayName}
        primaryGoal={primaryGoal}
        targetAreaSummary={targetAreaSummary}
        targetAreaLabels={targetAreas}
        avatarSignals={avatarSignals}
      />
      <nav
        aria-label="Dashboard sections"
        className="mt-10 flex gap-2 overflow-x-auto rounded-3xl border border-white/10 bg-white/[0.035] p-2"
      >
        {tabs.map((tab) => {
          const active = tab.id === selectedTab;
          return (
            <Link
              key={tab.id}
              href={
                tab.id === "overview"
                  ? "/dashboard"
                  : `/dashboard?tab=${tab.id}`
              }
              aria-current={active ? "page" : undefined}
              className={cn(
                "shrink-0 rounded-2xl px-4 py-2 text-sm font-bold transition",
                active
                  ? "bg-lime-300 text-slate-950 shadow-lg shadow-lime-500/15"
                  : "text-slate-300 hover:bg-white/10 hover:text-white",
              )}
            >
              {tab.label}
            </Link>
          );
        })}
      </nav>

      <p className="mt-4 text-sm text-slate-400">
        {tabs.find((tab) => tab.id === selectedTab)?.description}
      </p>

      {selectedTab === "overview" && (
        <OverviewPanel
          targetAreaSummary={targetAreaSummary}
          primaryGoal={primaryGoal}
          targetAreaLabels={targetAreas}
        />
      )}
      {selectedTab === "workout" && <WorkoutPanel />}
      {selectedTab === "check-ins" && <CheckInsPanel />}
      {selectedTab === "progress" && <ProgressPanel />}
      {selectedTab === "journal" && <JournalPanel />}
    </section>
  );
}

function OverviewPanel({
  targetAreaSummary,
  primaryGoal,
  targetAreaLabels,
}: {
  targetAreaSummary: string;
  primaryGoal: string;
  targetAreaLabels: string[];
}) {
  return (
    <>
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
              <PrimaryLink href="/workouts/active">Start workout</PrimaryLink>
              <SecondaryLink href="/workouts/history">
                View history
              </SecondaryLink>
              <GhostLink href="/routines">Manage routines</GhostLink>
            </div>
          </div>
        </Surface>

        <Surface className="p-7">
          <p className="text-sm font-bold tracking-[0.18em] text-slate-400 uppercase">
            Athlete profile
          </p>
          <p className="mt-5 text-sm text-slate-400">Primary goal</p>
          <p className="mt-1 text-2xl font-black tracking-tight">
            {primaryGoal}
          </p>
          <p className="mt-6 text-sm text-slate-400">Target areas</p>
          <ul className="mt-3 flex flex-wrap gap-2">
            {targetAreaLabels.map((area) => (
              <li
                key={area}
                className="rounded-full border border-violet-300/20 bg-violet-400/10 px-3 py-1 text-sm font-bold text-violet-100"
              >
                {area}
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

      <ActionGrid />
    </>
  );
}

function WorkoutPanel() {
  return (
    <div className="mt-6 grid gap-5 lg:grid-cols-3">
      <FeatureCard
        eyebrow="Live session"
        title="Start active workout"
        description="Open the set-by-set logger and capture the session while it happens."
        href="/workouts/active"
        action="Start workout"
        tone="lime"
      />
      <FeatureCard
        eyebrow="Templates"
        title="Manage routines"
        description="Create ordered templates that can become independent workout drafts."
        href="/routines"
        action="Open routines"
        tone="violet"
      />
      <FeatureCard
        eyebrow="Archive"
        title="Review workout history"
        description="Inspect completed sessions, sets, duration, and volume."
        href="/workouts/history"
        action="View history"
        tone="cyan"
      />
    </div>
  );
}

function CheckInsPanel() {
  return (
    <div className="mt-6 grid gap-5 lg:grid-cols-[1fr_0.8fr]">
      <FeatureCard
        eyebrow="Progress input"
        title="Record a progress check-in"
        description="Use check-ins to add measurements, visual context, and consistency signals over time."
        href="/check-ins/new"
        action="Log check-in"
        tone="violet"
      />
      <Surface className="p-7">
        <p className="text-sm font-bold tracking-[0.18em] text-slate-400 uppercase">
          Measurement loop
        </p>
        <h2 className="mt-3 text-3xl font-black tracking-tight">
          Check-ins are ready to log
        </h2>
        <p className="mt-3 leading-7 text-slate-300">
          Use the dedicated check-in flow for body weight, circumference,
          body-fat estimates, and private context notes. Media belongs in the
          next consent-first journal/media loop.
        </p>
      </Surface>
    </div>
  );
}

function ProgressPanel() {
  return (
    <div className="mt-6 grid gap-5 lg:grid-cols-2">
      <FeatureCard
        eyebrow="Trends"
        title="Open progress analytics"
        description="Review weight, measurements, consistency, and training-volume trend summaries."
        href="/progress"
        action="View progress"
        tone="lime"
      />
      <FeatureCard
        eyebrow="Body model"
        title="Inspect visual progress context"
        description="Use the body model as a visual aid for muscle-area context and progress review."
        href="/progress"
        action="Open model"
        tone="violet"
      />
    </div>
  );
}

function JournalPanel() {
  return (
    <div className="mt-6 grid gap-5 lg:grid-cols-[0.85fr_1.15fr]">
      <Surface className="p-7">
        <p className="text-sm font-bold tracking-[0.18em] text-slate-400 uppercase">
          Private notes
        </p>
        <h2 className="mt-3 text-3xl font-black tracking-tight">
          Journal and media are the next product loop
        </h2>
        <p className="mt-3 leading-7 text-slate-300">
          This area should become the private memory layer: training notes,
          progress photos, and body-context media attached to check-ins.
        </p>
      </Surface>
      <FeatureCard
        eyebrow="Planned surface"
        title="Build journal/media UI"
        description="Add creation, browsing, and privacy-first media states once the dashboard structure is merged."
        href="/journal"
        action="Open journal"
        tone="cyan"
      />
    </div>
  );
}

function ActionGrid() {
  const nextActions = [
    {
      label: "Start workout",
      href: "/workouts/active",
      detail: "Log sets while the session is live.",
      tone: "lime",
    },
    {
      label: "Log check-in",
      href: "/check-ins/new",
      detail: "Record body context and visual progress.",
      tone: "violet",
    },
    {
      label: "Build routine",
      href: "/routines",
      detail: "Create reusable training structure.",
      tone: "cyan",
    },
  ] as const;

  return (
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
  );
}

function FeatureCard({
  eyebrow,
  title,
  description,
  href,
  action,
  tone,
}: {
  eyebrow: string;
  title: string;
  description: string;
  href: string;
  action: string;
  tone: "lime" | "violet" | "cyan";
}) {
  return (
    <Surface className="p-7">
      <p
        className={cn(
          "text-sm font-bold tracking-[0.18em] uppercase",
          tone === "lime" && "text-lime-200",
          tone === "violet" && "text-violet-200",
          tone === "cyan" && "text-cyan-200",
        )}
      >
        {eyebrow}
      </p>
      <h2 className="mt-3 text-3xl font-black tracking-tight">{title}</h2>
      <p className="mt-3 min-h-20 leading-7 text-slate-300">{description}</p>
      <Link
        href={href}
        className={cn(
          "mt-6 inline-flex min-h-12 items-center justify-center rounded-2xl px-5 py-3 text-sm font-black transition",
          tone === "lime" && "bg-lime-300 text-slate-950 hover:bg-lime-200",
          tone === "violet" &&
            "border border-violet-300/30 bg-violet-400/10 text-violet-100 hover:bg-violet-400/15",
          tone === "cyan" &&
            "border border-cyan-300/30 bg-cyan-400/10 text-cyan-100 hover:bg-cyan-400/15",
        )}
      >
        {action}
      </Link>
    </Surface>
  );
}

function PrimaryLink({
  href,
  children,
}: {
  href: string;
  children: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      className="inline-flex min-h-12 items-center justify-center rounded-2xl bg-lime-300 px-6 py-3 text-sm font-black text-slate-950 shadow-lg shadow-lime-500/20 transition hover:bg-lime-200"
    >
      {children}
    </Link>
  );
}

function SecondaryLink({
  href,
  children,
}: {
  href: string;
  children: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      className="inline-flex min-h-12 items-center justify-center rounded-2xl border border-violet-300/30 bg-violet-400/10 px-6 py-3 text-sm font-bold text-violet-100 transition hover:bg-violet-400/15"
    >
      {children}
    </Link>
  );
}

function GhostLink({
  href,
  children,
}: {
  href: string;
  children: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      className="inline-flex min-h-12 items-center justify-center rounded-2xl border border-white/15 bg-white/[0.03] px-6 py-3 text-sm font-bold text-slate-100 transition hover:bg-white/10"
    >
      {children}
    </Link>
  );
}

function parseDashboardTab(value?: string): DashboardTab {
  return value && validTabs.has(value as DashboardTab)
    ? (value as DashboardTab)
    : "overview";
}
