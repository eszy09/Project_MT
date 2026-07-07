export function BodyModelFallback({
  reason,
  failed = false,
  selectedLabel = "Selected area",
}: {
  reason: string;
  failed?: boolean;
  selectedLabel?: string;
}) {
  return (
    <div className="flex min-h-96 flex-col items-center justify-center rounded-xl bg-slate-950/70 p-6 text-center">
      <svg
        viewBox="0 0 180 300"
        className="h-64 w-40"
        role="img"
        aria-label="Static front view of the approximate body model"
      >
        <circle cx="90" cy="35" r="25" fill="#94a3b8" />
        <rect x="52" y="67" width="76" height="92" rx="24" fill="#34d399" />
        <rect x="62" y="150" width="56" height="52" rx="15" fill="#f0ad42" />
        <rect x="25" y="75" width="22" height="125" rx="11" fill="#7ab8eb" />
        <rect x="133" y="75" width="22" height="125" rx="11" fill="#7ab8eb" />
        <rect x="60" y="195" width="25" height="95" rx="12" fill="#947ad9" />
        <rect x="95" y="195" width="25" height="95" rx="12" fill="#947ad9" />
      </svg>
      <p className="mt-4 font-semibold">
        {failed ? "Interactive model unavailable" : "Static model view"}
      </p>
      <p className="mt-2 text-sm text-emerald-200">{selectedLabel}</p>
      <p className="mt-2 max-w-md text-sm text-slate-400">{reason}</p>
    </div>
  );
}
