import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { Badge, PageHeader, StatCard, Surface } from "@/components";
import { requireSession } from "@/features/auth";
import { buildAvatarSignals } from "@/features/body-model";
import {
  experienceLevelOptions,
  primaryGoalLabel,
  targetAreaLabel,
} from "@/features/onboarding";
import { getLatestBodyCheckin, getOnboardingDraft } from "@/services";
import type { BodyCheckin } from "@/services";

export const metadata: Metadata = {
  title: "Settings",
  description:
    "Manage Project_MT profile, avatar baseline, and account settings.",
};

export default async function SettingsPage() {
  const session = await requireSession("/settings");
  const profile = await getOnboardingDraft();

  if (!profile?.completed) {
    redirect("/onboarding");
  }

  let latestCheckin: BodyCheckin | null = null;
  try {
    latestCheckin = await getLatestBodyCheckin();
  } catch {
    latestCheckin = null;
  }

  const avatarSignals = buildAvatarSignals({ profile, latestCheckin });
  const accountLabel = session.user.email ?? session.user.name ?? "Signed in";

  return (
    <section className="w-full">
      <PageHeader
        eyebrow="Settings"
        title="Profile and app setup"
        description="Manage the identity, body context, and check-in signals that shape the dashboard."
      >
        <Surface className="min-w-72 p-5" tone="active">
          <p className="text-sm font-black text-lime-100">Signed in as</p>
          <p className="mt-2 truncate text-2xl font-black tracking-tight text-white">
            {accountLabel}
          </p>
        </Surface>
      </PageHeader>

      <div className="mt-7 grid gap-5 lg:grid-cols-[0.85fr_1.15fr]">
        <Surface className="p-6">
          <div className="flex items-center gap-4">
            <ProfileMark
              label={profile.displayName}
              picture={session.user.picture}
            />
            <div className="min-w-0">
              <p className="text-xs font-black tracking-[0.18em] text-slate-500 uppercase">
                Display name
              </p>
              <h2 className="mt-1 truncate text-3xl font-black tracking-tight">
                {profile.displayName}
              </h2>
              <p className="mt-1 truncate text-sm text-slate-400">
                {session.user.email ?? "No email from auth provider"}
              </p>
            </div>
          </div>

          <div className="mt-6 grid gap-3 sm:grid-cols-2">
            <SettingLink href="/onboarding?step=1" label="Edit name" />
            <SettingLink href="/auth/logout" label="Sign out" subdued />
          </div>
        </Surface>

        <div className="grid gap-4 sm:grid-cols-3">
          <StatCard
            label="Avatar"
            value={avatarSignals.readiness.label}
            detail="Driven by profile and check-ins."
          />
          <StatCard
            label="Goal"
            value={
              profile.primaryGoal
                ? primaryGoalLabel(profile.primaryGoal)
                : "Unset"
            }
            detail="Used for dashboard context."
            accent="violet"
          />
          <StatCard
            label="Check-in"
            value={
              latestCheckin?.measuredAt
                ? formatDate(latestCheckin.measuredAt)
                : "None"
            }
            detail="Latest body signal."
            accent="cyan"
          />
        </div>
      </div>

      <div className="mt-5 grid gap-5 lg:grid-cols-3">
        <SettingsPanel
          eyebrow="Training"
          title="Goals and focus"
          actionHref="/onboarding?step=2"
          actionLabel="Edit goals"
        >
          <SettingsRow
            label="Primary goal"
            value={
              profile.primaryGoal
                ? primaryGoalLabel(profile.primaryGoal)
                : "Not set"
            }
          />
          <SettingsRow
            label="Target areas"
            value={
              profile.targetAreas.map(targetAreaLabel).join(", ") || "Not set"
            }
          />
        </SettingsPanel>

        <SettingsPanel
          eyebrow="Body context"
          title="Avatar baseline"
          actionHref="/onboarding?step=3"
          actionLabel="Edit context"
        >
          <SettingsRow
            label="Height"
            value={formatNumber(profile.heightCm, "cm")}
          />
          <SettingsRow
            label="Weight"
            value={formatNumber(profile.weightKg, "kg")}
          />
          <SettingsRow
            label="Experience"
            value={formatExperience(profile.experienceLevel)}
          />
        </SettingsPanel>

        <SettingsPanel
          eyebrow="Check-ins"
          title="Dashboard input"
          actionHref="/check-ins/new"
          actionLabel="New check-in"
        >
          <SettingsRow
            label="Latest"
            value={
              latestCheckin?.measuredAt
                ? formatDate(latestCheckin.measuredAt)
                : "No check-in yet"
            }
          />
          <SettingsRow
            label="Weight"
            value={formatMeasurement(latestCheckin?.weight)}
          />
          <SettingsRow
            label="Waist"
            value={formatMeasurement(latestCheckin?.waist)}
          />
        </SettingsPanel>
      </div>

      <Surface className="mt-5 p-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <Badge>Dashboard behavior</Badge>
            <h2 className="mt-3 text-3xl font-black tracking-tight">
              Check-ins update the avatar and progress cards
            </h2>
          </div>
          <div className="flex flex-wrap gap-3">
            <SettingLink href="/check-ins/new" label="Log check-in" />
            <SettingLink href="/dashboard" label="View dashboard" subdued />
          </div>
        </div>
      </Surface>
    </section>
  );
}

function ProfileMark({ label, picture }: { label: string; picture?: string }) {
  if (picture) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={picture}
        alt=""
        className="size-16 rounded-3xl border border-lime-300/30 object-cover shadow-lg shadow-lime-500/10"
      />
    );
  }

  return (
    <span className="grid size-16 place-items-center rounded-3xl border border-lime-300/30 bg-lime-300/10 text-xl font-black text-lime-200 shadow-lg shadow-lime-500/10">
      {initials(label)}
    </span>
  );
}

function SettingsPanel({
  eyebrow,
  title,
  actionHref,
  actionLabel,
  children,
}: {
  eyebrow: string;
  title: string;
  actionHref: string;
  actionLabel: string;
  children: React.ReactNode;
}) {
  return (
    <Surface className="p-6">
      <p className="text-xs font-black tracking-[0.18em] text-slate-500 uppercase">
        {eyebrow}
      </p>
      <h2 className="mt-2 text-2xl font-black tracking-tight">{title}</h2>
      <div className="mt-5 space-y-3">{children}</div>
      <div className="mt-6">
        <SettingLink href={actionHref} label={actionLabel} />
      </div>
    </Surface>
  );
}

function SettingsRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-3 rounded-2xl border border-white/10 bg-white/[0.025] p-3">
      <span className="text-sm font-bold text-slate-400">{label}</span>
      <span className="text-right text-sm font-black text-slate-100">
        {value}
      </span>
    </div>
  );
}

function SettingLink({
  href,
  label,
  subdued = false,
}: {
  href: string;
  label: string;
  subdued?: boolean;
}) {
  return (
    <Link
      href={href}
      className={
        subdued
          ? "inline-flex min-h-11 items-center justify-center rounded-2xl border border-white/15 bg-white/[0.03] px-4 py-2 text-sm font-black text-slate-100 transition hover:bg-white/10"
          : "inline-flex min-h-11 items-center justify-center rounded-2xl bg-lime-300 px-4 py-2 text-sm font-black text-slate-950 transition hover:bg-lime-200"
      }
    >
      {label}
    </Link>
  );
}

function formatNumber(value: number | null | undefined, unit: string) {
  return value ? `${value} ${unit}` : "Not set";
}

function formatMeasurement(value?: { value?: number; unit?: string }) {
  return value?.value ? `${value.value} ${value.unit ?? ""}`.trim() : "Not set";
}

function formatExperience(value: string | null | undefined) {
  return (
    experienceLevelOptions.find((option) => option.value === value)?.label ??
    "Not set"
  );
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat("en", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(new Date(value));
}

function initials(value: string) {
  const parts = value.trim().split(/\s+/).filter(Boolean);
  const first = parts[0]?.[0] ?? "M";
  const second = parts.length > 1 ? parts[1]?.[0] : parts[0]?.[1];
  return `${first}${second ?? "T"}`.toUpperCase();
}
