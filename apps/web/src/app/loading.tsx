export default function Loading() {
  return (
    <div
      role="status"
      aria-live="polite"
      className="flex w-full items-center justify-center"
    >
      <div className="text-center">
        <div className="mx-auto h-8 w-8 animate-spin rounded-full border-2 border-slate-700 border-t-emerald-300" />
        <p className="mt-4 text-slate-300">Loading Project_MT…</p>
      </div>
    </div>
  );
}
