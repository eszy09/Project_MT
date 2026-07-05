export default function DashboardLoading() {
  return (
    <div
      role="status"
      aria-live="polite"
      className="flex w-full items-center justify-center"
    >
      <p className="text-slate-300">Checking your secure session&hellip;</p>
    </div>
  );
}
