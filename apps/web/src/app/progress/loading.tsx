export default function ProgressLoading() {
  return (
    <section className="w-full" aria-busy="true" aria-live="polite">
      <p className="text-sm font-semibold tracking-widest text-emerald-300 uppercase">
        Progress
      </p>
      <h1 className="mt-3 text-4xl font-bold">Loading your trends…</h1>
      <div className="mt-8 grid gap-5 lg:grid-cols-2">
        {Array.from({ length: 4 }, (_, index) => (
          <div
            key={index}
            className="h-80 animate-pulse rounded-2xl border border-white/10 bg-white/5"
          />
        ))}
      </div>
    </section>
  );
}
