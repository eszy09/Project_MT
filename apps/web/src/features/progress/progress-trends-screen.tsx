import Link from "next/link";
import { Badge, Surface } from "@/components";
import { BodyModelCard } from "@/features/body-model";
import type { ProgressTrends, TrendSeries } from "./progress-trends";

export function ProgressTrendsScreen({
  trends,
  selectedDays,
  error,
}: {
  trends: ProgressTrends;
  selectedDays: number;
  error?: { message: string; requestId: string | null } | null;
}) {
  const series = [
    trends.weight,
    trends.circumference,
    trends.consistency,
    trends.volume,
  ];

  return (
    <section className="w-full">
      <Link
        href="/dashboard"
        className="text-sm font-bold text-slate-400 transition hover:text-white"
      >
        ← Dashboard
      </Link>
      <div className="mt-5 grid gap-8 lg:grid-cols-[1fr_auto] lg:items-end">
        <div>
          <Badge>Progress command view</Badge>
          <h1 className="mt-5 text-5xl font-black tracking-[-0.05em] sm:text-6xl">
            Understand your trends
          </h1>
          <p className="mt-4 max-w-2xl text-lg leading-8 text-slate-300">
            These summaries describe recorded changes and training consistency.
            They do not diagnose health conditions or claim medical causation.
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
                <option value={30}>Last 30 days</option>
                <option value={90}>Last 90 days</option>
                <option value={180}>Last 180 days</option>
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
          className="mt-6 rounded-2xl border border-amber-300/30 bg-amber-300/10 p-4 text-amber-100"
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

      <BodyModelCard />

      <div className="mt-8 grid gap-5 lg:grid-cols-2">
        {series.map((trend) => (
          <TrendChart key={trend.id} trend={trend} />
        ))}
      </div>
    </section>
  );
}

export function TrendChart({ trend }: { trend: TrendSeries }) {
  const titleId = `${trend.id}-title`;
  const summaryId = `${trend.id}-summary`;
  const coordinates = chartCoordinates(trend.points);

  return (
    <article className="rounded-[2rem] border border-white/10 bg-white/[0.045] p-5 shadow-xl shadow-black/20">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 id={titleId} className="text-2xl font-black tracking-tight">
            {trend.title}
          </h2>
          <p className="mt-1 text-sm text-slate-400">{trend.dateRange}</p>
        </div>
        <span className="rounded-full border border-violet-300/25 bg-violet-400/10 px-3 py-1 text-xs font-black text-violet-100">
          {trend.unit}
        </span>
      </div>

      {trend.limitedMessage ? (
        <div className="mt-5 flex min-h-48 items-center justify-center rounded-3xl border border-dashed border-white/15 bg-slate-950/35 p-6 text-center text-slate-400">
          <p>{trend.limitedMessage}</p>
        </div>
      ) : (
        <svg
          viewBox="0 0 600 220"
          className="mt-5 h-52 w-full overflow-visible"
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
        className="mt-4 border-t border-white/10 pt-4 text-sm leading-6 text-slate-300"
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
