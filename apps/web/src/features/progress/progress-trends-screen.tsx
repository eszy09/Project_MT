import Link from "next/link";
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
        className="text-sm font-semibold text-slate-400 hover:text-white"
      >
        ← Dashboard
      </Link>
      <div className="mt-4 flex flex-wrap items-end justify-between gap-5">
        <div>
          <p className="text-sm font-semibold tracking-widest text-emerald-300 uppercase">
            Progress
          </p>
          <h1 className="mt-2 text-4xl font-bold tracking-tight">
            Understand your trends
          </h1>
          <p className="mt-3 max-w-2xl text-slate-300">
            These summaries describe recorded changes and training consistency.
            They do not diagnose health conditions or claim medical causation.
          </p>
        </div>
        <form className="flex items-end gap-3">
          <label className="text-sm">
            <span className="mb-2 block text-slate-400">Date range</span>
            <select
              name="days"
              defaultValue={selectedDays}
              className="min-h-11 rounded-lg border border-white/15 bg-slate-950 px-3"
            >
              <option value={30}>Last 30 days</option>
              <option value={90}>Last 90 days</option>
              <option value={180}>Last 180 days</option>
            </select>
          </label>
          <button
            type="submit"
            className="min-h-11 rounded-lg border border-emerald-300/30 px-4 font-semibold text-emerald-200"
          >
            Update
          </button>
        </form>
      </div>

      {error && (
        <div
          role="alert"
          className="mt-6 rounded-xl border border-amber-300/30 bg-amber-300/10 p-4 text-amber-100"
        >
          <p>{error.message}</p>
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
    <article className="rounded-2xl border border-white/10 bg-slate-900/60 p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 id={titleId} className="text-xl font-bold">
            {trend.title}
          </h2>
          <p className="mt-1 text-sm text-slate-400">{trend.dateRange}</p>
        </div>
        <span className="rounded-full bg-white/10 px-3 py-1 text-xs font-semibold text-slate-300">
          {trend.unit}
        </span>
      </div>

      {trend.limitedMessage ? (
        <div className="mt-5 flex min-h-48 items-center justify-center rounded-xl border border-dashed border-white/15 p-6 text-center text-slate-400">
          <p>{trend.limitedMessage}</p>
        </div>
      ) : (
        <svg
          viewBox="0 0 600 220"
          className="mt-5 h-52 w-full"
          role="img"
          aria-labelledby={`${titleId} ${summaryId}`}
        >
          <path
            d="M40 20V190H580"
            fill="none"
            stroke="rgb(148 163 184 / 35%)"
            strokeWidth="2"
          />
          <polyline
            points={coordinates}
            fill="none"
            stroke="#6ee7b7"
            strokeWidth="5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          {coordinates.split(" ").map((coordinate) => {
            const [x, y] = coordinate.split(",");
            return (
              <circle key={coordinate} cx={x} cy={y} r="6" fill="#6ee7b7" />
            );
          })}
        </svg>
      )}

      <p
        id={summaryId}
        className="mt-4 border-t border-white/10 pt-4 text-sm leading-6 text-slate-300"
      >
        <span className="font-semibold text-white">Text summary: </span>
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
