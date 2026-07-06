export default function ActiveWorkoutLoading() {
  return (
    <div className="w-full animate-pulse" role="status" aria-live="polite">
      <span className="sr-only">Loading active workout</span>
      <div className="h-5 w-28 rounded bg-white/10" />
      <div className="mt-6 h-10 w-64 rounded bg-white/10" />
      <div className="mt-3 h-5 max-w-xl rounded bg-white/5" />
      <div className="mt-10 grid gap-6 lg:grid-cols-[minmax(0,1fr)_20rem]">
        <div>
          <div className="grid grid-cols-3 gap-3">
            {[1, 2, 3].map((item) => (
              <div
                key={item}
                className="h-20 rounded-xl border border-white/5 bg-white/[0.025]"
              />
            ))}
          </div>
          <div className="mt-6 h-72 rounded-2xl border border-white/5 bg-white/[0.025]" />
        </div>
        <div className="h-64 rounded-2xl border border-white/5 bg-white/[0.025]" />
      </div>
    </div>
  );
}
