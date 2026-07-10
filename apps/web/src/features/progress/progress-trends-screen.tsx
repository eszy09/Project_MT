import Link from "next/link";
import { Badge, Surface } from "@/components";
import { BodyModelCard, type AvatarSignals } from "@/features/body-model";
import type { ProgressTrends, TrendSeries } from "./progress-trends";

export function ProgressTrendsScreen({
  trends,
  selectedDays,
  error,
  avatarComparison,
}: {
  trends: ProgressTrends;
  selectedDays: number;
  error?: { message: string; requestId: string | null } | null;
  avatarComparison: AvatarComparison;
}) {
  const series = [
    trends.weight,
    trends.circumference,
    trends.consistency,
    trends.volume,
  ];

  return (
    <section className="w-full">
      <div className="grid gap-5 lg:grid-cols-[1fr_auto] lg:items-end">
        <div>
          <Badge>Progress</Badge>
          <h1 className="mt-4 text-4xl font-black tracking-[-0.05em] sm:text-6xl">
            Trends and avatar signals
          </h1>
          <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-400">
            These trends do not diagnose health conditions.
          </p>
        </div>
        <Surface className="p-4">
          <form className="flex items-end gap-3">
            <label className="text-sm font-bold">
              <span className="mb-2 block text-slate-400">Date range</span>
              <select
                name="days"
                defaultValue={selectedDays}
                className="min-h-12 rounded-2xl border border-white/10 bg-slate-950/80 px-3 transition outline-none focus:border-lime-300/70"
              >
                <option value={30}>30 days</option>
                <option value={90}>90 days</option>
                <option value={180}>180 days</option>
              </select>
            </label>
            <button
              type="submit"
              className="min-h-12 rounded-2xl border border-lime-300/30 bg-lime-300/10 px-4 font-black text-lime-200 transition hover:bg-lime-300/15"
            >
              Update
            </button>
          </form>
        </Surface>
      </div>

      {error && (
        <div
          role="alert"
          className="mt-5 rounded-2xl border border-amber-300/30 bg-amber-300/10 p-4 text-amber-100"
        >
          <p className="font-bold">Progress needs attention</p>
          <p className="mt-1">{error.message}</p>
          {error.requestId && (
            <p className="mt-2 font-mono text-xs">
              Reference: {error.requestId}
            </p>
          )}
        </div>
      )}

      <AvatarProgressComparison comparison={avatarComparison} />

      <div className="mt-5 grid gap-5 xl:grid-cols-[0.82fr_1.18fr]">
        <BodyModelCard />
        <div className="grid gap-4 lg:grid-cols-2">
          {series.map((trend) => (
            <TrendChart key={trend.id} trend={trend} />
          ))}
        </div>
      </div>
    </section>
  );
}

export function TrendChart({ trend }: { trend: TrendSeries }) {
  const titleId = `${trend.id}-title`;
  const summaryId = `${trend.id}-summary`;
  const coordinates = chartCoordinates(trend.points);

  return (
    <article className="rounded-[1.75rem] border border-white/10 bg-white/[0.045] p-4 shadow-xl shadow-black/20">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 id={titleId} className="text-xl font-black tracking-tight">
            {trend.title}
          </h2>
          <p className="mt-1 text-sm text-slate-500">{trend.dateRange}</p>
        </div>
        <span className="rounded-full border border-violet-300/25 bg-violet-400/10 px-3 py-1 text-xs font-black text-violet-100">
          {trend.unit}
        </span>
      </div>

      {trend.limitedMessage ? (
        <div className="mt-4 flex min-h-40 items-center justify-center rounded-3xl border border-dashed border-white/15 bg-slate-950/35 p-5 text-center text-slate-400">
          <p>{trend.limitedMessage}</p>
        </div>
      ) : (
        <svg
          viewBox="0 0 600 220"
          className="mt-4 h-44 w-full overflow-visible"
          role="img"
          aria-labelledby={`${titleId} ${summaryId}`}
        >
          <defs>
            <linearGradient id={`${trend.id}-line`} x1="0" x2="1" y1="0" y2="0">
              <stop stopColor="#bef264" />
              <stop offset="1" stopColor="#a78bfa" />
            </linearGradient>
          </defs>
          <path
            d="M40 20V190H580"
            fill="none"
            stroke="rgb(148 163 184 / 35%)"
            strokeWidth="2"
          />
          <polyline
            points={coordinates}
            fill="none"
            stroke={`url(#${trend.id}-line)`}
            strokeWidth="5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          {coordinates.split(" ").map((coordinate) => {
            const [x, y] = coordinate.split(",");
            return (
              <circle
                key={coordinate}
                cx={x}
                cy={y}
                r="6"
                fill="#bef264"
                stroke="#03040b"
                strokeWidth="3"
              />
            );
          })}
        </svg>
      )}

      <p
        id={summaryId}
        className="mt-3 border-t border-white/10 pt-3 text-sm leading-6 text-slate-300"
      >
        <span className="font-black text-white">Text summary: </span>
        {trend.summary}
      </p>
    </article>
  );
}

function chartCoordinates(points: readonly { value: number }[]) {
  if (points.length === 0) return "";
  const values = points.map((point) => point.value);
  const minimum = Math.min(...values);
  const maximum = Math.max(...values);
  const range = maximum - minimum || 1;
  return points
    .map((point, index) => {
      const x =
        points.length === 1 ? 310 : 40 + (index / (points.length - 1)) * 540;
      const y = 190 - ((point.value - minimum) / range) * 170;
      return `${x.toFixed(1)},${y.toFixed(1)}`;
    })
    .join(" ");
}

export type AvatarComparison = {
  current: AvatarSignals;
  previous: AvatarSignals | null;
};

function AvatarProgressComparison({
  comparison,
}: {
  comparison: AvatarComparison;
}) {
  const rows = [
    [
      "Torso",
      comparison.current.scales.torso,
      comparison.previous?.scales.torso,
    ],
    [
      "Waist",
      comparison.current.scales.waist,
      comparison.previous?.scales.waist,
    ],
    ["Hip", comparison.current.scales.hip, comparison.previous?.scales.hip],
    ["Arm", comparison.current.scales.arm, comparison.previous?.scales.arm],
    [
      "Thigh",
      comparison.current.scales.thigh,
      comparison.previous?.scales.thigh,
    ],
  ] as const;

  return (
    <Surface className="mt-6 p-5 sm:p-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <Badge>Avatar comparison</Badge>
          <h2 className="mt-3 text-3xl font-black tracking-[-0.04em]">
            Current vs previous
          </h2>
        </div>
        <Link
          href="/check-ins/new"
          className="rounded-2xl bg-lime-300 px-5 py-3 text-sm font-black text-slate-950 transition hover:bg-lime-200"
        >
          New check-in
        </Link>
      </div>

      <div className="mt-5 grid gap-3 sm:grid-cols-5">
        {rows.map(([label, current, previous]) => (
          <AvatarDeltaRow
            key={label}
            label={label}
            current={current}
            previous={previous ?? null}
          />
        ))}
      </div>
    </Surface>
  );
}

function AvatarDeltaRow({
  label,
  current,
  previous,
}: {
  label: string;
  current: number;
  previous: number | null;
}) {
  const delta = previous === null ? null : current - previous;

  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.025] p-3 text-sm">
      <p className="font-black">{label}</p>
      <p className="mt-2 font-mono text-slate-300">{current.toFixed(2)}x</p>
      <p className="mt-1 font-mono text-lime-200">
        {delta === null ? "—" : `${delta >= 0 ? "+" : ""}${delta.toFixed(2)}`}
      </p>
    </div>
  );
}
