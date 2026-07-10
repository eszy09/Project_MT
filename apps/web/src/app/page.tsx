import { ActionLink, PageHeader, StatCard, Surface } from "@/components";

const loops = [
  ["Workout", "Log sets"],
  ["Check-in", "Update body"],
  ["Progress", "Compare trends"],
] as const;

export default function HomePage() {
  return (
    <section className="w-full">
      <PageHeader
        eyebrow="Premium fitness tracking"
        title="A human-first training dashboard."
        description="Project_MT connects workouts, check-ins, progress, and your avatar into one clean training loop."
      >
        <Surface className="hidden min-w-72 p-5 lg:block" tone="active">
          <p className="text-sm font-black text-lime-100">Core loop</p>
          <p className="mt-2 text-3xl font-black tracking-tight text-white">
            Train → Check in → Adapt
          </p>
        </Surface>
      </PageHeader>

      <div className="mt-8 flex flex-wrap gap-3">
        <ActionLink href="/auth/login">Sign in</ActionLink>
        <ActionLink href="/dashboard" variant="secondary">
          Open dashboard
        </ActionLink>
      </div>

      <div className="mt-10 grid gap-4 md:grid-cols-3">
        <StatCard
          label="Avatar"
          value="Human"
          detail="Built from measurements."
        />
        <StatCard
          label="Workout"
          value="Live"
          detail="Set-by-set logging."
          accent="violet"
        />
        <StatCard
          label="Progress"
          value="Visual"
          detail="Trends with context."
          accent="cyan"
        />
      </div>

      <div className="mt-5 grid gap-4 md:grid-cols-3">
        {loops.map(([title, value]) => (
          <Surface key={title} className="min-h-36">
            <p className="text-sm font-black tracking-[0.18em] text-slate-500 uppercase">
              {title}
            </p>
            <h2 className="mt-3 text-3xl font-black tracking-tight">{value}</h2>
          </Surface>
        ))}
      </div>
    </section>
  );
}
