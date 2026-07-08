import { ActionLink, PageHeader, StatCard, Surface } from "@/components";

const foundations = [
  {
    title: "Reliable workout logging",
    description:
      "Capture exercises, sets, reps, load, and session history without turning training into admin work.",
  },
  {
    title: "Visual progress",
    description:
      "Connect body measurements, check-ins, and trends to a visual model of what is changing.",
  },
  {
    title: "Explainable guidance",
    description:
      "Make recommendations understandable so the athlete knows what to focus on next.",
  },
];

export default function HomePage() {
  return (
    <section className="w-full">
      <PageHeader
        eyebrow="Premium fitness tracking"
        title="Train with context. Track progress you can understand."
        description="Project_MT is a visual-first strength-training and body-recomposition platform built around workouts, check-ins, and meaningful progress signals."
      >
        <div className="hidden min-w-72 rounded-[2rem] border border-violet-300/25 bg-violet-400/10 p-5 lg:block">
          <p className="text-sm font-bold text-violet-100">
            Today&apos;s intent
          </p>
          <p className="mt-3 text-3xl font-black tracking-tight text-white">
            Lift. Log. Learn.
          </p>
          <p className="mt-3 text-sm leading-6 text-slate-300">
            A serious training dashboard with enough energy to feel like motion.
          </p>
        </div>
      </PageHeader>

      <div className="mt-10 flex flex-wrap gap-3">
        <ActionLink href="/auth/login">Start building</ActionLink>
        <ActionLink href="/dashboard" variant="secondary">
          Open dashboard
        </ActionLink>
      </div>

      <div className="mt-12 grid gap-5 md:grid-cols-3">
        <StatCard
          label="Workout loop"
          value="Set-by-set"
          detail="The core flow starts with logging real training sessions."
        />
        <StatCard
          label="Check-ins"
          value="Visual"
          detail="Progress gets tied to body context, not just raw numbers."
          accent="violet"
        />
        <StatCard
          label="Guidance"
          value="Clear"
          detail="The app should explain why the next action matters."
          accent="cyan"
        />
      </div>

      <div className="mt-5 grid gap-5 md:grid-cols-3">
        {foundations.map((foundation) => (
          <Surface key={foundation.title}>
            <h2 className="text-xl font-black tracking-tight">
              {foundation.title}
            </h2>

            <p className="mt-3 leading-7 text-slate-300">
              {foundation.description}
            </p>
          </Surface>
        ))}
      </div>
    </section>
  );
}
