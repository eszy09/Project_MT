"use client";

import Link from "next/link";
import { useState } from "react";
import { Badge, Surface, cn } from "@/components";
import type {
  WorkoutDetail,
  WorkoutHistoryItem,
  WorkoutHistoryPage,
} from "@/services";
import { exerciseCatalog } from "./exercise-catalog";
import {
  loadWorkoutDetailAction,
  loadWorkoutHistoryAction,
} from "./history-actions";

type Filters = {
  exerciseCode?: string;
  from?: string;
  to?: string;
};

export function WorkoutHistoryScreen({
  initialPage,
  filters,
  formValues,
  initialError = null,
}: {
  initialPage: WorkoutHistoryPage;
  filters: Filters;
  formValues: { exercise?: string; from?: string; to?: string };
  initialError?: { message: string; requestId: string | null } | null;
}) {
  const [items, setItems] = useState<readonly WorkoutHistoryItem[]>(
    initialPage.items ?? [],
  );
  const [nextCursor, setNextCursor] = useState(initialPage.nextCursor ?? null);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState(initialError);
  const [details, setDetails] = useState<Record<string, WorkoutDetail>>({});
  const [loadingDetail, setLoadingDetail] = useState<string | null>(null);

  const loadMore = async () => {
    if (!nextCursor) return;
    setLoadingMore(true);
    const result = await loadWorkoutHistoryAction(filters, nextCursor);
    setLoadingMore(false);
    if (!result.success) {
      setError({ message: result.error, requestId: result.requestId });
      return;
    }
    setItems((current) => [...current, ...(result.page.items ?? [])]);
    setNextCursor(result.page.nextCursor ?? null);
  };

  const loadDetail = async (workoutId: string) => {
    if (details[workoutId] || loadingDetail === workoutId) return;
    setLoadingDetail(workoutId);
    const result = await loadWorkoutDetailAction(workoutId);
    setLoadingDetail(null);
    if (!result.success) {
      setError({ message: result.error, requestId: result.requestId });
      return;
    }
    setDetails((current) => ({ ...current, [workoutId]: result.workout }));
  };

  const totalCompletedSets = items.reduce(
    (total, item) => total + (item.completedSetCount ?? 0),
    0,
  );
  const totalVolume = items.reduce(
    (total, item) => total + (item.completedVolumeKg ?? 0),
    0,
  );

  return (
    <section className="w-full">
      <div className="grid gap-8 lg:grid-cols-[1fr_auto] lg:items-end">
        <div>
          <Link
            href="/dashboard"
            className="text-sm font-bold text-slate-400 transition hover:text-white"
          >
            ← Dashboard
          </Link>
          <Badge className="mt-5">Workout archive</Badge>
          <h1 className="mt-5 text-5xl font-black tracking-[-0.05em] sm:text-6xl">
            Workout history
          </h1>
          <p className="mt-4 max-w-2xl text-lg leading-8 text-slate-300">
            Review completed sessions, inspect sets, and use previous work as
            training context without changing historical records.
          </p>
        </div>
        <Link
          href="/workouts/active"
          className="inline-flex min-h-12 items-center justify-center rounded-2xl bg-lime-300 px-6 py-3 font-black text-slate-950 shadow-lg shadow-lime-500/20 transition hover:bg-lime-200"
        >
          Start workout
        </Link>
      </div>

      <div className="mt-8 grid gap-4 md:grid-cols-3">
        <SummaryCard label="Sessions shown" value={items.length} />
        <SummaryCard label="Completed sets" value={totalCompletedSets} />
        <SummaryCard
          label="Completed volume"
          value={`${formatNumber(totalVolume)} total kg·reps`}
        />
      </div>

      <Surface className="mt-6 p-4">
        <form className="grid gap-3 sm:grid-cols-4">
          <label className="text-sm font-bold">
            <span className="mb-2 block text-slate-400">Exercise</span>
            <select
              name="exercise"
              defaultValue={formValues.exercise ?? ""}
              className="min-h-12 w-full rounded-2xl border border-white/10 bg-slate-950/80 px-3 outline-none transition focus:border-lime-300/70"
            >
              <option value="">All exercises</option>
              {exerciseCatalog.map((exercise) => (
                <option key={exercise.code} value={exercise.code}>
                  {exercise.name}
                </option>
              ))}
            </select>
          </label>
          <DateFilter name="from" label="From" value={formValues.from} />
          <DateFilter name="to" label="To" value={formValues.to} />
          <button
            type="submit"
            className="min-h-12 self-end rounded-2xl border border-lime-300/30 bg-lime-300/10 px-4 font-black text-lime-200 transition hover:bg-lime-300/15"
          >
            Apply filters
          </button>
        </form>
      </Surface>

      {error && (
        <div
          role="alert"
          className="mt-5 rounded-2xl border border-amber-300/30 bg-amber-300/10 p-4 text-amber-100"
        >
          <p className="font-bold">History needs attention</p>
          <p className="mt-1">{error.message}</p>
          {error.requestId && (
            <p className="mt-2 font-mono text-xs">
              Reference: {error.requestId}
            </p>
          )}
        </div>
      )}

      {items.length === 0 && !error ? (
        <Surface className="mt-8 border-dashed p-12 text-center">
          <h2 className="text-2xl font-black tracking-tight">
            No completed workouts found
          </h2>
          <p className="mx-auto mt-3 max-w-md leading-7 text-slate-400">
            Complete a workout or adjust the filters. Once sessions exist, this
            page becomes your performance archive.
          </p>
        </Surface>
      ) : (
        <div className="mt-6 space-y-4">
          {items.map((item) => (
            <details
              key={item.id}
              onToggle={(event) => {
                if (event.currentTarget.open && item.id) {
                  void loadDetail(item.id);
                }
              }}
              className="group overflow-hidden rounded-[2rem] border border-white/10 bg-white/[0.045] shadow-xl shadow-black/20 open:border-lime-300/25"
            >
              <summary className="cursor-pointer list-none p-5 sm:p-6">
                <div className="mb-4 flex items-center justify-between gap-4">
                  <div>
                    <p className="text-xs font-black tracking-[0.18em] text-lime-200 uppercase">
                      Completed session
                    </p>
                    <p className="mt-2 text-xl font-black tracking-tight">
                      {formatDate(item.completedAt)}
                    </p>
                  </div>
                  <span className="rounded-full border border-violet-300/25 bg-violet-400/10 px-3 py-1 text-xs font-black text-violet-100">
                    Open details
                  </span>
                </div>
                <div className="grid gap-3 sm:grid-cols-4">
                  <Metric
                    label="Duration"
                    value={formatDuration(item.durationSeconds)}
                  />
                  <Metric label="Exercises" value={item.exerciseCount ?? 0} />
                  <Metric
                    label="Sets"
                    value={`${item.completedSetCount ?? 0}/${item.setCount ?? 0}`}
                  />
                  <Metric
                    label="Volume"
                    value={`${formatNumber(item.completedVolumeKg)} kg·reps`}
                  />
                </div>
              </summary>
              <div className="border-t border-white/10 p-5 sm:p-6">
                {item.id && details[item.id] ? (
                  <WorkoutDetails workout={details[item.id]} />
                ) : (
                  <p className="text-sm text-slate-400">
                    {loadingDetail === item.id
                      ? "Loading workout details…"
                      : "Open again to retry details."}
                  </p>
                )}
              </div>
            </details>
          ))}
        </div>
      )}

      {nextCursor && (
        <button
          type="button"
          disabled={loadingMore}
          onClick={() => void loadMore()}
          className="mx-auto mt-6 block min-h-12 rounded-2xl border border-white/15 px-6 font-black transition hover:bg-white/10 disabled:opacity-50"
        >
          {loadingMore ? "Loading…" : "Load more workouts"}
        </button>
      )}
    </section>
  );
}

function WorkoutDetails({ workout }: { workout: WorkoutDetail }) {
  return (
    <ol className="space-y-5">
      {(workout.exercises ?? []).map((exercise) => (
        <li
          key={`${exercise.position}-${exercise.exerciseCode}`}
          className="rounded-3xl border border-white/10 bg-slate-950/40 p-5"
        >
          <h3 className="text-lg font-black">
            {exercise.position}. {exercise.displayName}
          </h3>
          <div className="mt-4 overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="text-slate-500">
                <tr>
                  <th className="pb-2">Set</th>
                  <th className="pb-2">Weight</th>
                  <th className="pb-2">Reps</th>
                  <th className="pb-2">Status</th>
                </tr>
              </thead>
              <tbody>
                {(exercise.sets ?? []).map((set) => (
                  <tr key={set.position} className="border-t border-white/5">
                    <td className="py-3 font-bold">{set.position}</td>
                    <td>{set.weightKg} kg</td>
                    <td>{set.repetitions}</td>
                    <td>
                      <span
                        className={cn(
                          "rounded-full px-2 py-1 text-xs font-black",
                          set.completedAt
                            ? "bg-lime-300/10 text-lime-200"
                            : "bg-white/5 text-slate-400",
                        )}
                      >
                        {set.completedAt ? "Completed" : "Incomplete"}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </li>
      ))}
    </ol>
  );
}

function DateFilter({
  name,
  label,
  value,
}: {
  name: string;
  label: string;
  value?: string;
}) {
  return (
    <label className="text-sm font-bold">
      <span className="mb-2 block text-slate-400">{label}</span>
      <input
        type="date"
        name={name}
        defaultValue={value}
        className="min-h-12 w-full rounded-2xl border border-white/10 bg-slate-950/80 px-3 outline-none transition focus:border-lime-300/70"
      />
    </label>
  );
}

function SummaryCard({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-3xl border border-white/10 bg-white/[0.045] p-5">
      <p className="text-xs font-black tracking-[0.18em] text-slate-500 uppercase">
        {label}
      </p>
      <p className="mt-3 text-3xl font-black tracking-tight">{value}</p>
    </div>
  );
}

function Metric({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-slate-950/45 p-4">
      <p className="text-xs font-bold text-slate-500">{label}</p>
      <p className="mt-1 font-black">{value}</p>
    </div>
  );
}

function formatDate(value?: string) {
  return value
    ? new Intl.DateTimeFormat("en", {
        dateStyle: "medium",
        timeStyle: "short",
      }).format(new Date(value))
    : "—";
}

function formatDuration(seconds = 0) {
  const minutes = Math.round(seconds / 60);
  return minutes >= 60
    ? `${Math.floor(minutes / 60)}h ${minutes % 60}m`
    : `${minutes}m`;
}

function formatNumber(value?: number) {
  return new Intl.NumberFormat("en", {
    maximumFractionDigits: 1,
  }).format(value ?? 0);
}

