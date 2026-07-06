"use client";

import Link from "next/link";
import { useState } from "react";
import type { Routine } from "@/services";
import { exerciseCatalog } from "@/features/workouts/exercise-catalog";
import { changeRoutineStateAction, saveRoutineAction } from "./routine-actions";

export function RoutineManager({
  initialRoutines,
}: {
  initialRoutines: Routine[];
}) {
  const [routines, setRoutines] = useState(initialRoutines);
  const [editing, setEditing] = useState<Routine | null>(null);
  const [error, setError] = useState<string | null>(null);

  const mutate = async (
    routine: Routine,
    operation: "archive" | "restore" | "delete",
  ) => {
    if (!routine.id || !routine.version) return;
    const result = await changeRoutineStateAction(
      routine.id,
      routine.version,
      operation,
    );
    if (!result.success) return setError(result.error);
    if (operation === "delete") {
      setRoutines((items) => items.filter((item) => item.id !== routine.id));
    } else {
      setRoutines((items) =>
        items.map((item) =>
          item.id === routine.id
            ? {
                ...item,
                version: (item.version ?? 0) + 1,
                archivedAt:
                  operation === "archive"
                    ? new Date().toISOString()
                    : undefined,
              }
            : item,
        ),
      );
    }
  };

  return (
    <section className="w-full">
      <Link href="/dashboard" className="text-sm text-slate-400">
        ← Dashboard
      </Link>
      <h1 className="mt-4 text-4xl font-bold">Routines</h1>
      <p className="mt-2 text-slate-300">
        Reusable templates become independent workout drafts.
      </p>
      {error && (
        <p
          role="alert"
          className="mt-4 rounded-xl bg-amber-300/10 p-4 text-amber-200"
        >
          {error}
        </p>
      )}
      <RoutineForm
        editing={editing}
        onSaved={(routine) => {
          setRoutines((items) => {
            const exists = items.some((item) => item.id === routine.id);
            return exists
              ? items.map((item) => (item.id === routine.id ? routine : item))
              : [routine, ...items];
          });
          setEditing(null);
        }}
        onError={setError}
      />
      <div className="mt-8 grid gap-4 lg:grid-cols-2">
        {routines.map((routine) => (
          <article
            key={routine.id}
            className="rounded-2xl border border-white/10 bg-slate-900/60 p-5"
          >
            <div className="flex justify-between gap-4">
              <div>
                <h2 className="text-xl font-bold">{routine.name}</h2>
                <p className="mt-1 text-sm text-slate-400">
                  {routine.muscleGroup?.replace("_", " ")}
                </p>
              </div>
              {routine.archivedAt && (
                <span className="text-xs text-amber-300">Archived</span>
              )}
            </div>
            <p className="mt-3 text-sm text-slate-300">
              {routine.exercises?.length ?? 0} exercises
            </p>
            <div className="mt-5 flex flex-wrap gap-2">
              {!routine.archivedAt && routine.id && (
                <Link
                  href={`/workouts/active?routineId=${routine.id}`}
                  className="rounded-lg bg-emerald-300 px-4 py-2 font-bold text-slate-950"
                >
                  Start
                </Link>
              )}
              {!routine.archivedAt && (
                <button
                  onClick={() => setEditing(routine)}
                  className="rounded-lg border px-4 py-2"
                >
                  Edit
                </button>
              )}
              <button
                onClick={() =>
                  void mutate(
                    routine,
                    routine.archivedAt ? "restore" : "archive",
                  )
                }
                className="rounded-lg border px-4 py-2"
              >
                {routine.archivedAt ? "Restore" : "Archive"}
              </button>
              {routine.archivedAt && (
                <button
                  onClick={() => void mutate(routine, "delete")}
                  className="rounded-lg border border-red-300/30 px-4 py-2 text-red-200"
                >
                  Delete
                </button>
              )}
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}

function RoutineForm({
  editing,
  onSaved,
  onError,
}: {
  editing: Routine | null;
  onSaved: (routine: Routine) => void;
  onError: (error: string) => void;
}) {
  const firstExercise = editing?.exercises?.[0];
  return (
    <form
      key={editing?.id ?? "new"}
      className="mt-8 grid gap-3 rounded-2xl border border-white/10 p-5 sm:grid-cols-2"
      onSubmit={(event) => {
        event.preventDefault();
        const data = new FormData(event.currentTarget);
        const exercise = exerciseCatalog.find(
          (item) => item.code === data.get("exercise"),
        );
        if (!exercise) return;
        void saveRoutineAction({
          id: editing?.id,
          version: editing?.version,
          routine: {
            name: String(data.get("name")),
            muscleGroup: String(data.get("muscleGroup")),
            description: String(data.get("description")) || undefined,
            exercises: [
              {
                exerciseCode: exercise.code,
                displayName: exercise.name,
                sets: [
                  {
                    targetWeightKg: data.get("weight")
                      ? Number(data.get("weight"))
                      : undefined,
                    targetRepetitions: Number(data.get("reps")),
                  },
                ],
              },
            ],
          },
        }).then((result) =>
          result.success ? onSaved(result.routine) : onError(result.error),
        );
      }}
    >
      <input
        required
        name="name"
        defaultValue={editing?.name}
        placeholder="Routine name"
        className="min-h-11 rounded-lg bg-slate-950 px-3"
      />
      <select
        name="muscleGroup"
        defaultValue={editing?.muscleGroup ?? "FULL_BODY"}
        className="min-h-11 rounded-lg bg-slate-950 px-3"
      >
        {[
          "CHEST",
          "BACK",
          "SHOULDERS",
          "ARMS",
          "LEGS",
          "FULL_BODY",
          "OTHER",
        ].map((value) => (
          <option key={value}>{value}</option>
        ))}
      </select>
      <input
        name="description"
        defaultValue={editing?.description}
        placeholder="Description"
        className="min-h-11 rounded-lg bg-slate-950 px-3 sm:col-span-2"
      />
      <select
        name="exercise"
        defaultValue={firstExercise?.exerciseCode ?? exerciseCatalog[0].code}
        className="min-h-11 rounded-lg bg-slate-950 px-3"
      >
        {exerciseCatalog.map((exercise) => (
          <option key={exercise.code} value={exercise.code}>
            {exercise.name}
          </option>
        ))}
      </select>
      <div className="flex gap-2">
        <input
          name="weight"
          type="number"
          min="0"
          max="2000"
          defaultValue={firstExercise?.sets?.[0]?.targetWeightKg}
          placeholder="kg"
          className="min-h-11 min-w-0 flex-1 rounded-lg bg-slate-950 px-3"
        />
        <input
          required
          name="reps"
          type="number"
          min="1"
          max="1000"
          defaultValue={firstExercise?.sets?.[0]?.targetRepetitions ?? 8}
          placeholder="reps"
          className="min-h-11 min-w-0 flex-1 rounded-lg bg-slate-950 px-3"
        />
      </div>
      <button className="min-h-11 rounded-lg bg-emerald-300 font-bold text-slate-950 sm:col-span-2">
        {editing ? "Update routine" : "Create routine"}
      </button>
    </form>
  );
}
