import Link from "next/link";
import { redirect } from "next/navigation";
import { requireSession } from "@/features/auth";
import { primaryGoalLabel, targetAreaLabel } from "@/features/onboarding";
import { getOnboardingDraft } from "@/services";

export default async function DashboardPage() {
  await requireSession("/dashboard");
  const profile = await getOnboardingDraft();

  if (!profile?.completed || !profile.primaryGoal) {
    redirect("/onboarding");
  }

  return (
    <section className="w-full">
      <p className="text-sm font-semibold tracking-widest text-emerald-300 uppercase">
        Your training space
      </p>

      <h1 className="mt-3 text-4xl font-bold tracking-tight">
        Welcome, {profile.displayName}
      </h1>

      <p className="mt-5 max-w-2xl text-lg text-slate-300">
        Your starting point is saved. Project_MT can now shape your training
        around {primaryGoalLabel(profile.primaryGoal).toLowerCase()}.
      </p>

      <div className="mt-10 grid gap-5 lg:grid-cols-3">
        <article className="rounded-2xl border border-emerald-300/30 bg-emerald-300/10 p-6 lg:col-span-2">
          <p className="text-sm font-semibold text-emerald-200">
            Recommended next step
          </p>
          <h2 className="mt-2 text-2xl font-bold">Log your first workout</h2>
          <p className="mt-3 text-slate-300">
            Build a focused session with exercises that emphasize{" "}
            {profile.targetAreas.map(targetAreaLabel).join(", ").toLowerCase()}.
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <Link
              href="/workouts/active"
              className="inline-flex min-h-11 items-center justify-center rounded-lg bg-emerald-300 px-5 py-2 font-bold text-slate-950 hover:bg-emerald-200"
            >
              Start workout
            </Link>
            <Link
              href="/workouts/history"
              className="inline-flex min-h-11 items-center justify-center rounded-lg border border-emerald-300/30 px-5 py-2 font-semibold text-emerald-200"
            >
              View workout history
            </Link>
            <Link
              href="/routines"
              className="inline-flex min-h-11 items-center justify-center rounded-lg border border-white/15 px-5 py-2 font-semibold"
            >
              Manage routines
            </Link>
            <Link
              href="/progress"
              className="inline-flex min-h-11 items-center justify-center rounded-lg border border-white/15 px-5 py-2 font-semibold"
            >
              View progress
            </Link>
          </div>
        </article>

        <article className="rounded-2xl border border-white/10 bg-white/5 p-6">
          <p className="text-sm text-slate-400">Primary goal</p>
          <p className="mt-2 text-xl font-semibold">
            {primaryGoalLabel(profile.primaryGoal)}
          </p>
          <p className="mt-5 text-sm text-slate-400">Target areas</p>
          <ul className="mt-2 flex flex-wrap gap-2">
            {profile.targetAreas.map((area) => (
              <li
                key={area}
                className="rounded-full bg-white/10 px-3 py-1 text-sm"
              >
                {targetAreaLabel(area)}
              </li>
            ))}
          </ul>
        </article>
      </div>

      <div className="mt-5 grid gap-5 sm:grid-cols-3">
        {[
          ["1", "Log your first workout"],
          ["2", "Create a reusable routine"],
          ["3", "Record a progress check-in"],
        ].map(([number, label]) => (
          <div
            key={number}
            className="rounded-xl border border-white/10 p-5 text-slate-300"
          >
            <span className="text-sm font-bold text-emerald-300">{number}</span>
            <p className="mt-2 font-semibold text-white">{label}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
