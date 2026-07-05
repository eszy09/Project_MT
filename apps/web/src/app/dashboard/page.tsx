import { requireSession } from "@/features/auth";

export default async function DashboardPage() {
  const session = await requireSession("/dashboard");
  const displayName = session.user.name ?? session.user.email ?? "athlete";

  return (
    <section className="w-full">
      <p className="text-sm font-semibold tracking-widest text-emerald-300 uppercase">
        Your training space
      </p>

      <h1 className="mt-3 text-4xl font-bold tracking-tight">
        Welcome back, {displayName}
      </h1>

      <p className="mt-5 max-w-2xl text-lg text-slate-300">
        Your authenticated Project_MT session is active. Workout, routine, and
        progress features will be added here in later iterations.
      </p>
    </section>
  );
}
