"use client";

import Link from "next/link";
import { useState } from "react";
import type {
  WorkoutDetail,
  WorkoutHistoryItem,
  WorkoutHistoryPage,
} from "@/services";
import {
  loadWorkoutDetailAction,
  loadWorkoutHistoryAction,
} from "./history-actions";
import { exerciseCatalog } from "./exercise-catalog";

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

  return (
    <section className="w-full">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <Link
            href="/dashboard"
            className="text-sm font-semibold text-slate-400 hover:text-white"
          >
            ← Dashboard
          </Link>
          <h1 className="mt-4 text-3xl font-bold sm:text-4xl">
            Workout history
          </h1>
          <p className="mt-2 text-slate-300">
            Review completed sessions without changing historical records.
          </p>
        </div>
        <Link
          href="/workouts/active"
          className="rounded-xl bg-emerald-300 px-5 py-3 font-bold text-slate-950"
        >
          Start workout
        </Link>
      </div>

      <form className="mt-8 grid gap-3 rounded-2xl border border-white/10 bg-slate-900/60 p-4 sm:grid-cols-4">
        <label className="text-sm">
          <span className="mb-2 block text-slate-400">Exercise</span>
          <select
            name="exercise"
            defaultValue={formValues.exercise ?? ""}
            className="min-h-11 w-full rounded-lg bg-slate-950 px-3"
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
          className="min-h-11 self-end rounded-lg border border-emerald-300/30 px-4 font-semibold text-emerald-200"
        >
          Apply filters
        </button>
      </form>

      {error && (
        <div
          role="alert"
          className="mt-5 rounded-xl border border-amber-300/30 bg-amber-300/10 p-4 text-amber-100"
        >
          <p>{error.message}</p>
          {error.requestId && (
            <p className="mt-2 font-mono text-xs">
              Reference: {error.requestId}
            </p>
          )}
        </div>
      )}

      {items.length === 0 && !error ? (
        <div className="mt-8 rounded-2xl border border-dashed border-white/15 p-12 text-center">
          <h2 className="text-xl font-bold">No completed workouts found</h2>
          <p className="mt-2 text-slate-400">
            Complete a workout or adjust the filters.
          </p>
        </div>
      ) : (
        <div className="mt-6 space-y-3">
          {items.map((item) => (
            <details
              key={item.id}
              onToggle={(event) => {
                if (event.currentTarget.open && item.id) {
                  void loadDetail(item.id);
                }
              }}
              className="rounded-2xl border border-white/10 bg-slate-900/60"
            >
              <summary className="cursor-pointer list-none p-5">
                <div className="grid gap-3 sm:grid-cols-5">
                  <Metric
                    label="Completed"
                    value={formatDate(item.completedAt)}
                  />
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
              <div className="border-t border-white/10 p-5">
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
          className="mx-auto mt-6 block min-h-11 rounded-xl border border-white/15 px-6 font-semibold disabled:opacity-50"
        >
          {loadingMore ? "Loading…" : "Load more workouts"}
        </button>
      )}
    </section>
  );
}

function WorkoutDetails({ workout }: { workout: WorkoutDetail }) {
  return (
    <ol className="space-y-4">
      {(workout.exercises ?? []).map((exercise) => (
        <li key={`${exercise.position}-${exercise.exerciseCode}`}>
          <h3 className="font-bold">
            {exercise.position}. {exercise.displayName}
          </h3>
          <div className="mt-2 overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="text-slate-500">
                <tr>
                  <th>Set</th>
                  <th>Weight</th>
                  <th>Reps</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {(exercise.sets ?? []).map((set) => (
                  <tr key={set.position} className="border-t border-white/5">
                    <td className="py-2">{set.position}</td>
                    <td>{set.weightKg} kg</td>
                    <td>{set.repetitions}</td>
                    <td>{set.completedAt ? "Completed" : "Incomplete"}</td>
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
    <label className="text-sm">
      <span className="mb-2 block text-slate-400">{label}</span>
      <input
        type="date"
        name={name}
        defaultValue={value}
        className="min-h-11 w-full rounded-lg bg-slate-950 px-3"
      />
    </label>
  );
}

function Metric({ label, value }: { label: string; value: string | number }) {
  return (
    <div>
      <p className="text-xs text-slate-500">{label}</p>
      <p className="mt-1 font-semibold">{value}</p>
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
