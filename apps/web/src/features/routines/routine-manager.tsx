"use client";

import Link from "next/link";
import { useState } from "react";
import { exerciseCatalog } from "@/features/workouts/exercise-catalog";
import type { Routine, RoutineInput } from "@/services";
import { changeRoutineStateAction, saveRoutineAction } from "./routine-actions";

type EditorSet = {
  key: string;
  targetWeightKg: string;
  targetRepetitions: string;
  notes: string;
};

type EditorExercise = {
  key: string;
  exerciseCode: string;
  notes: string;
  sets: EditorSet[];
};

export function RoutineManager({
  initialRoutines,
}: {
  initialRoutines: Routine[];
}) {
  const [routines, setRoutines] = useState(initialRoutines);
  const [editing, setEditing] = useState<Routine | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);

  const mutate = async (
    routine: Routine,
    operation: "archive" | "restore" | "delete",
  ) => {
    if (!routine.id || !routine.version) return;
    if (
      (operation === "archive" || operation === "delete") &&
      !window.confirm(
        operation === "delete"
          ? `Permanently delete ${routine.name}?`
          : `Archive ${routine.name}?`,
      )
    ) {
      return;
    }

    setBusyId(routine.id);
    const result = await changeRoutineStateAction(
      routine.id,
      routine.version,
      operation,
    );
    setBusyId(null);
    if (!result.success) {
      setError(result.error);
      return;
    }

    setError(null);
    setSuccess(
      operation === "delete"
        ? "Routine deleted."
        : operation === "archive"
          ? "Routine archived."
          : "Routine restored.",
    );
    setRoutines((items) =>
      operation === "delete"
        ? items.filter((item) => item.id !== routine.id)
        : items.map((item) =>
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
  };

  return (
    <section className="w-full">
      <Link href="/dashboard" className="text-sm text-slate-400">
        ← Dashboard
      </Link>
      <h1 className="mt-4 text-4xl font-bold">Routines</h1>
      <p className="mt-2 text-slate-300">
        Build ordered templates that become independent workout drafts.
      </p>

      {error && (
        <p
          role="alert"
          className="mt-4 rounded-xl bg-amber-300/10 p-4 text-amber-200"
        >
          {error}
        </p>
      )}
      {success && (
        <p
          role="status"
          className="mt-4 rounded-xl bg-emerald-300/10 p-4 text-emerald-200"
        >
          {success}
        </p>
      )}

      <RoutineEditor
        key={editing?.id ?? "new"}
        editing={editing}
        onCancel={() => setEditing(null)}
        onError={setError}
        onSaved={(routine) => {
          setRoutines((items) =>
            items.some((item) => item.id === routine.id)
              ? items.map((item) => (item.id === routine.id ? routine : item))
              : [routine, ...items],
          );
          setEditing(null);
          setError(null);
          setSuccess(editing ? "Routine updated." : "Routine created.");
        }}
      />

      <div className="mt-8 grid gap-4 lg:grid-cols-2">
        {routines.length === 0 && (
          <div className="rounded-2xl border border-dashed border-white/15 p-10 text-center lg:col-span-2">
            <h2 className="text-xl font-bold">No routines yet</h2>
            <p className="mt-2 text-slate-400">
              Create your first reusable training plan above.
            </p>
          </div>
        )}

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
            {routine.description && (
              <p className="mt-3 text-sm text-slate-300">
                {routine.description}
              </p>
            )}
            <details className="mt-4 rounded-xl border border-white/10 p-3">
              <summary className="cursor-pointer font-semibold">
                View {routine.exercises?.length ?? 0} exercises
              </summary>
              <ol className="mt-3 space-y-3">
                {(routine.exercises ?? []).map((exercise) => (
                  <li key={exercise.position}>
                    <p className="font-semibold">
                      {exercise.position}. {exercise.displayName}
                    </p>
                    <p className="text-xs text-slate-400">
                      {(exercise.sets ?? [])
                        .map(
                          (set) =>
                            `${set.targetWeightKg ?? "—"} kg × ${set.targetRepetitions}`,
                        )
                        .join(" · ")}
                    </p>
                  </li>
                ))}
              </ol>
            </details>
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
                  type="button"
                  onClick={() => setEditing(routine)}
                  className="rounded-lg border px-4 py-2"
                >
                  Edit
                </button>
              )}
              <button
                type="button"
                disabled={busyId === routine.id}
                onClick={() =>
                  void mutate(
                    routine,
                    routine.archivedAt ? "restore" : "archive",
                  )
                }
                className="rounded-lg border px-4 py-2 disabled:opacity-50"
              >
                {busyId === routine.id
                  ? "Working…"
                  : routine.archivedAt
                    ? "Restore"
                    : "Archive"}
              </button>
              {routine.archivedAt && (
                <button
                  type="button"
                  disabled={busyId === routine.id}
                  onClick={() => void mutate(routine, "delete")}
                  className="rounded-lg border border-red-300/30 px-4 py-2 text-red-200 disabled:opacity-50"
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

function RoutineEditor({
  editing,
  onSaved,
  onError,
  onCancel,
}: {
  editing: Routine | null;
  onSaved: (routine: Routine) => void;
  onError: (error: string) => void;
  onCancel: () => void;
}) {
  const [exercises, setExercises] = useState<EditorExercise[]>(() =>
    editing?.exercises?.length
      ? editing.exercises.map((exercise) => ({
          key: crypto.randomUUID(),
          exerciseCode: exercise.exerciseCode ?? exerciseCatalog[0].code,
          notes: exercise.notes ?? "",
          sets: (exercise.sets ?? []).map((set) => ({
            key: crypto.randomUUID(),
            targetWeightKg:
              set.targetWeightKg === undefined
                ? ""
                : String(set.targetWeightKg),
            targetRepetitions: String(set.targetRepetitions ?? 8),
            notes: set.notes ?? "",
          })),
        }))
      : [newExercise()],
  );
  const [saving, setSaving] = useState(false);

  const moveExercise = (index: number, offset: number) => {
    const target = index + offset;
    if (target < 0 || target >= exercises.length) return;
    setExercises((items) => {
      const next = [...items];
      [next[index], next[target]] = [next[target], next[index]];
      return next;
    });
  };

  const updateExercise = (
    index: number,
    update: (exercise: EditorExercise) => EditorExercise,
  ) =>
    setExercises((items) =>
      items.map((exercise, position) =>
        position === index ? update(exercise) : exercise,
      ),
    );

  return (
    <form
      className="mt-8 space-y-4 rounded-2xl border border-white/10 p-5"
      onSubmit={(event) => {
        event.preventDefault();
        const data = new FormData(event.currentTarget);
        const routine: RoutineInput = {
          name: String(data.get("name")),
          muscleGroup: String(data.get("muscleGroup")),
          description: String(data.get("description")) || undefined,
          exercises: exercises.map((exercise) => {
            const catalogExercise =
              exerciseCatalog.find(
                (candidate) => candidate.code === exercise.exerciseCode,
              ) ?? exerciseCatalog[0];
            return {
              exerciseCode: catalogExercise.code,
              displayName: catalogExercise.name,
              notes: exercise.notes || undefined,
              sets: exercise.sets.map((set) => ({
                targetWeightKg: set.targetWeightKg
                  ? Number(set.targetWeightKg)
                  : undefined,
                targetRepetitions: Number(set.targetRepetitions),
                notes: set.notes || undefined,
              })),
            };
          }),
        };
        setSaving(true);
        void saveRoutineAction({
          id: editing?.id,
          version: editing?.version,
          routine,
        }).then((result) => {
          setSaving(false);
          if (result.success) {
            onSaved(result.routine);
          } else {
            onError(result.error);
          }
        });
      }}
    >
      <div className="grid gap-3 sm:grid-cols-2">
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
      </div>

      <ol className="space-y-4">
        {exercises.map((exercise, exerciseIndex) => (
          <li
            key={exercise.key}
            className="rounded-xl border border-white/10 bg-slate-900/60 p-4"
          >
            <div className="flex flex-wrap items-center gap-2">
              <span className="font-bold">{exerciseIndex + 1}</span>
              <select
                aria-label={`Exercise ${exerciseIndex + 1}`}
                value={exercise.exerciseCode}
                onChange={(event) =>
                  updateExercise(exerciseIndex, (current) => ({
                    ...current,
                    exerciseCode: event.target.value,
                  }))
                }
                className="min-h-11 min-w-48 flex-1 rounded-lg bg-slate-950 px-3"
              >
                {exerciseCatalog.map((item) => (
                  <option key={item.code} value={item.code}>
                    {item.name}
                  </option>
                ))}
              </select>
              <OrderButtons
                label={`exercise ${exerciseIndex + 1}`}
                first={exerciseIndex === 0}
                last={exerciseIndex === exercises.length - 1}
                onMove={(offset) => moveExercise(exerciseIndex, offset)}
              />
              <button
                type="button"
                disabled={exercises.length === 1}
                onClick={() =>
                  setExercises((items) =>
                    items.filter((_, index) => index !== exerciseIndex),
                  )
                }
                className="min-h-11 rounded-lg px-3 text-red-200 disabled:opacity-30"
              >
                Remove
              </button>
            </div>

            <ol className="mt-3 space-y-2">
              {exercise.sets.map((set, setIndex) => (
                <li key={set.key} className="flex flex-wrap items-center gap-2">
                  <span className="w-6 text-sm text-slate-400">
                    {setIndex + 1}
                  </span>
                  <input
                    aria-label={`Exercise ${exerciseIndex + 1} set ${setIndex + 1} weight`}
                    type="number"
                    min="0"
                    max="2000"
                    step="0.001"
                    value={set.targetWeightKg}
                    onChange={(event) =>
                      updateSet(setExercises, exerciseIndex, setIndex, {
                        targetWeightKg: event.target.value,
                      })
                    }
                    placeholder="kg"
                    className="min-h-11 w-24 rounded-lg bg-slate-950 px-3"
                  />
                  <input
                    required
                    aria-label={`Exercise ${exerciseIndex + 1} set ${setIndex + 1} repetitions`}
                    type="number"
                    min="1"
                    max="1000"
                    value={set.targetRepetitions}
                    onChange={(event) =>
                      updateSet(setExercises, exerciseIndex, setIndex, {
                        targetRepetitions: event.target.value,
                      })
                    }
                    placeholder="reps"
                    className="min-h-11 w-24 rounded-lg bg-slate-950 px-3"
                  />
                  <OrderButtons
                    label={`exercise ${exerciseIndex + 1} set ${setIndex + 1}`}
                    first={setIndex === 0}
                    last={setIndex === exercise.sets.length - 1}
                    onMove={(offset) =>
                      moveSet(setExercises, exerciseIndex, setIndex, offset)
                    }
                  />
                  <button
                    type="button"
                    disabled={exercise.sets.length === 1}
                    onClick={() =>
                      updateExercise(exerciseIndex, (current) => ({
                        ...current,
                        sets: current.sets.filter(
                          (_, index) => index !== setIndex,
                        ),
                      }))
                    }
                    className="min-h-11 px-2 text-red-200 disabled:opacity-30"
                  >
                    Remove set
                  </button>
                </li>
              ))}
            </ol>
            <button
              type="button"
              onClick={() =>
                updateExercise(exerciseIndex, (current) => ({
                  ...current,
                  sets: [...current.sets, newSet()],
                }))
              }
              className="mt-3 min-h-11 text-sm font-semibold text-emerald-300"
            >
              + Add set
            </button>
          </li>
        ))}
      </ol>

      <button
        type="button"
        onClick={() => setExercises((items) => [...items, newExercise()])}
        className="min-h-11 rounded-lg border border-emerald-300/30 px-4 text-emerald-200"
      >
        + Add exercise
      </button>
      <div className="flex flex-wrap gap-3">
        <button
          disabled={saving}
          className="min-h-11 rounded-lg bg-emerald-300 px-6 font-bold text-slate-950 disabled:opacity-50"
        >
          {saving ? "Saving…" : editing ? "Update routine" : "Create routine"}
        </button>
        {editing && (
          <button
            type="button"
            onClick={onCancel}
            className="min-h-11 rounded-lg border px-5"
          >
            Cancel editing
          </button>
        )}
      </div>
    </form>
  );
}

function OrderButtons({
  label,
  first,
  last,
  onMove,
}: {
  label: string;
  first: boolean;
  last: boolean;
  onMove: (offset: number) => void;
}) {
  return (
    <>
      <button
        type="button"
        disabled={first}
        aria-label={`Move ${label} up`}
        onClick={() => onMove(-1)}
        className="size-11 disabled:opacity-30"
      >
        ↑
      </button>
      <button
        type="button"
        disabled={last}
        aria-label={`Move ${label} down`}
        onClick={() => onMove(1)}
        className="size-11 disabled:opacity-30"
      >
        ↓
      </button>
    </>
  );
}

function newSet(): EditorSet {
  return {
    key: crypto.randomUUID(),
    targetWeightKg: "",
    targetRepetitions: "8",
    notes: "",
  };
}

function newExercise(): EditorExercise {
  return {
    key: crypto.randomUUID(),
    exerciseCode: exerciseCatalog[0].code,
    notes: "",
    sets: [newSet()],
  };
}

function updateSet(
  setExercises: React.Dispatch<React.SetStateAction<EditorExercise[]>>,
  exerciseIndex: number,
  setIndex: number,
  patch: Partial<EditorSet>,
) {
  setExercises((items) =>
    items.map((exercise, index) =>
      index === exerciseIndex
        ? {
            ...exercise,
            sets: exercise.sets.map((set, position) =>
              position === setIndex ? { ...set, ...patch } : set,
            ),
          }
        : exercise,
    ),
  );
}

function moveSet(
  setExercises: React.Dispatch<React.SetStateAction<EditorExercise[]>>,
  exerciseIndex: number,
  setIndex: number,
  offset: number,
) {
  setExercises((items) =>
    items.map((exercise, index) => {
      if (index !== exerciseIndex) return exercise;
      const target = setIndex + offset;
      if (target < 0 || target >= exercise.sets.length) return exercise;
      const sets = [...exercise.sets];
      [sets[setIndex], sets[target]] = [sets[target], sets[setIndex]];
      return { ...exercise, sets };
    }),
  );
}
