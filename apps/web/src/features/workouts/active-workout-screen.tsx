"use client";

import Link from "next/link";
import { useEffect, useMemo, useReducer, useRef, useState } from "react";
import {
  activeWorkoutReducer,
  calculateWorkoutVolume,
  createActiveWorkoutState,
  validateSet,
  workoutCompletionError,
  type WorkoutExerciseDraft,
  type WorkoutSetDraft,
} from "./active-workout-state";
import {
  clearActiveWorkoutDraft,
  loadActiveWorkoutDraft,
  saveActiveWorkoutDraft,
  type RecoverableWorkoutDraft,
} from "./active-workout-storage";
import {
  completeWorkoutAction,
  loadPreviousPerformanceAction,
} from "./actions";
import { exerciseCatalog, type ExerciseCatalogItem } from "./exercise-catalog";
import { useUnsavedWorkoutWarning } from "./use-unsaved-workout-warning";

export function ActiveWorkoutScreen({
  startedAt,
  completionKey,
  draftOwnerKey,
}: {
  startedAt: string;
  completionKey: string;
  draftOwnerKey: string;
}) {
  const [state, dispatch] = useReducer(
    activeWorkoutReducer,
    { startedAt, completionKey },
    ({ startedAt: initialStartedAt, completionKey: initialCompletionKey }) =>
      createActiveWorkoutState(initialStartedAt, initialCompletionKey),
  );
  const [pickerOpen, setPickerOpen] = useState(false);
  const [recoveryChecked, setRecoveryChecked] = useState(false);
  const [recoveryCandidate, setRecoveryCandidate] = useState<{
    savedAt: string;
    draft: RecoverableWorkoutDraft;
  } | null>(null);
  const [storageWarning, setStorageWarning] = useState<string | null>(null);
  const addExerciseButtonRef = useRef<HTMLButtonElement>(null);
  const stateRef = useRef(state);
  const elapsedSeconds = useElapsedSeconds(state.startedAt);
  const totalSetCount = state.exercises.reduce(
    (total, exercise) => total + exercise.sets.length,
    0,
  );
  const completedSetCount = state.exercises.reduce(
    (total, exercise) =>
      total + exercise.sets.filter((set) => set.completedAt !== null).length,
    0,
  );
  const volume = calculateWorkoutVolume(state);

  useUnsavedWorkoutWarning(state.dirty && state.status !== "completed");

  useEffect(() => {
    const timer = window.setTimeout(() => {
      const result = loadActiveWorkoutDraft(draftOwnerKey);

      if (result.status === "available") {
        setRecoveryCandidate({
          savedAt: result.savedAt,
          draft: result.draft,
        });
      } else if (result.status === "unavailable") {
        setStorageWarning(
          "Workout recovery is unavailable in this browser. Keep this page open until your workout is saved.",
        );
      }

      setRecoveryChecked(true);
    }, 0);

    return () => window.clearTimeout(timer);
  }, [draftOwnerKey]);

  useEffect(() => {
    if (!recoveryChecked || recoveryCandidate) {
      return;
    }

    const timer = window.setTimeout(() => {
      if (state.status === "completed") {
        clearActiveWorkoutDraft(draftOwnerKey);
        return;
      }

      if (state.dirty) {
        const saved = saveActiveWorkoutDraft(draftOwnerKey, state);

        setStorageWarning(
          saved
            ? null
            : "This workout could not be stored for recovery. Keep this page open until it is saved.",
        );
      }
    }, 0);

    return () => window.clearTimeout(timer);
  }, [draftOwnerKey, recoveryCandidate, recoveryChecked, state]);

  useEffect(() => {
    stateRef.current = state;
  }, [state]);

  useEffect(() => {
    const persistLatestDraft = () => {
      const latestState = stateRef.current;

      if (
        recoveryChecked &&
        !recoveryCandidate &&
        latestState.dirty &&
        latestState.status !== "completed"
      ) {
        saveActiveWorkoutDraft(draftOwnerKey, latestState);
      }
    };

    window.addEventListener("pagehide", persistLatestDraft);
    return () => window.removeEventListener("pagehide", persistLatestDraft);
  }, [draftOwnerKey, recoveryCandidate, recoveryChecked]);

  if (state.status === "completed" && state.completedWorkout) {
    return (
      <CompletedWorkoutView
        workout={state.completedWorkout}
        onStartAnother={() => {
          clearActiveWorkoutDraft(draftOwnerKey);
          dispatch({
            type: "discarded",
            startedAt: new Date().toISOString(),
            completionKey: crypto.randomUUID(),
          });
        }}
      />
    );
  }

  const closePicker = () => {
    setPickerOpen(false);
    window.setTimeout(() => addExerciseButtonRef.current?.focus(), 0);
  };

  const addExercise = (exercise: ExerciseCatalogItem) => {
    const exerciseId = crypto.randomUUID();
    dispatch({
      type: "exercise-added",
      exercise,
      id: exerciseId,
      setId: crypto.randomUUID(),
    });
    closePicker();
    void loadPreviousPerformance(exerciseId, exercise.code);
  };

  const loadPreviousPerformance = async (
    exerciseId: string,
    exerciseCode: string,
  ) => {
    dispatch({ type: "previous-performance-loading", exerciseId });
    const result = await loadPreviousPerformanceAction(exerciseCode);
    dispatch(
      result.success
        ? {
            type: "previous-performance-loaded",
            exerciseId,
            sets: result.sets,
          }
        : { type: "previous-performance-failed", exerciseId },
    );
  };

  const discardWorkout = () => {
    if (
      state.dirty &&
      !window.confirm(
        "Discard this workout and remove all unsaved exercises and notes?",
      )
    ) {
      return;
    }

    clearActiveWorkoutDraft(draftOwnerKey);
    dispatch({
      type: "discarded",
      startedAt: new Date().toISOString(),
      completionKey: crypto.randomUUID(),
    });
  };

  const completeWorkout = async () => {
    const validationError = workoutCompletionError(state);
    dispatch({ type: "completion-requested" });

    if (validationError) {
      return;
    }

    const result = await completeWorkoutAction({
      completionKey: state.completionKey,
      workout: {
        startedAt: state.startedAt,
        completedAt: new Date().toISOString(),
        notes: optionalText(state.notes),
        exercises: state.exercises.map((exercise) => ({
          exerciseCode: exercise.exerciseCode,
          displayName: exercise.displayName,
          notes: optionalText(exercise.notes),
          sets: exercise.sets.map((set) => ({
            weightKg: Number(set.weightKg),
            repetitions: Number(set.repetitions),
            completedAt: set.completedAt ?? undefined,
            notes: optionalText(set.notes),
          })),
        })),
      },
    });

    if (!result.success) {
      dispatch({
        type: "save-failed",
        message: result.error,
        requestId: result.requestId,
      });
      return;
    }

    dispatch({
      type: "save-completed",
      workout: result.workout,
    });
  };

  return (
    <section className="w-full pb-24">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <Link
            href="/dashboard"
            className="inline-flex min-h-11 items-center gap-2 rounded-lg px-1 text-sm font-semibold text-slate-300 hover:text-white"
          >
            <ArrowLeftIcon />
            Dashboard
          </Link>
          <div className="mt-4 flex items-center gap-3">
            <span className="inline-flex items-center gap-2 rounded-full border border-emerald-300/30 bg-emerald-300/10 px-3 py-1 text-xs font-bold tracking-wider text-emerald-200 uppercase">
              <span className="size-2 rounded-full bg-emerald-300 motion-safe:animate-pulse" />
              Active
            </span>
            <span
              aria-label={`Workout duration ${formatDuration(elapsedSeconds)}`}
              className="font-mono text-sm text-slate-400"
            >
              {formatDuration(elapsedSeconds)}
            </span>
          </div>
          <h1 className="mt-3 text-3xl font-bold tracking-tight sm:text-4xl">
            Today&apos;s workout
          </h1>
          <p className="mt-2 max-w-2xl text-slate-300">
            Build the session in the order you plan to train. Your work remains
            local until the completed workout is saved.
          </p>
        </div>

        <button
          type="button"
          onClick={discardWorkout}
          className="min-h-11 rounded-lg border border-red-300/25 px-4 py-2 text-sm font-semibold text-red-200 hover:bg-red-300/10"
        >
          Discard workout
        </button>
      </div>

      <div className="mt-8 grid gap-6 lg:grid-cols-[minmax(0,1fr)_20rem]">
        <div className="min-w-0">
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <Metric label="Exercises" value={state.exercises.length} />
            <Metric label="Sets" value={totalSetCount} />
            <Metric
              label="Planned volume"
              value={formatVolume(volume.planned)}
            />
            <Metric
              label="Completed volume"
              value={formatVolume(volume.completed)}
            />
          </div>

          <div className="mt-6 flex items-center justify-between gap-4">
            <div>
              <h2 className="text-xl font-bold">Exercises</h2>
              <p className="mt-1 text-sm text-slate-400">
                The order below becomes part of your workout history.
              </p>
            </div>
            <button
              ref={addExerciseButtonRef}
              type="button"
              onClick={() => setPickerOpen(true)}
              className="inline-flex min-h-11 items-center justify-center gap-2 rounded-lg bg-emerald-300 px-4 py-2 text-sm font-bold text-slate-950 hover:bg-emerald-200"
            >
              <PlusIcon />
              Add exercise
            </button>
          </div>

          {state.error && (
            <div
              role="alert"
              className="mt-5 flex items-start justify-between gap-4 rounded-xl border border-amber-300/30 bg-amber-300/10 p-4 text-sm text-amber-100"
            >
              <div>
                <p className="font-semibold">Workout needs attention</p>
                <p className="mt-1 text-amber-100/80">{state.error}</p>
                {state.requestId && (
                  <p className="mt-2 font-mono text-xs text-amber-200">
                    Reference: {state.requestId}
                  </p>
                )}
              </div>
              <button
                type="button"
                onClick={() => dispatch({ type: "error-dismissed" })}
                aria-label="Dismiss workout message"
                className="flex size-11 shrink-0 items-center justify-center rounded-lg hover:bg-white/10"
              >
                <CloseIcon />
              </button>
            </div>
          )}

          {storageWarning && (
            <div
              role="status"
              className="mt-5 rounded-xl border border-sky-300/25 bg-sky-300/10 p-4 text-sm text-sky-100"
            >
              <p className="font-semibold">Recovery notice</p>
              <p className="mt-1 text-sky-100/80">{storageWarning}</p>
            </div>
          )}

          {state.exercises.length === 0 ? (
            <EmptyWorkout onAdd={() => setPickerOpen(true)} />
          ) : (
            <ol className="mt-5 space-y-4">
              {state.exercises.map((exercise, index) => (
                <ExerciseCard
                  key={exercise.id}
                  exercise={exercise}
                  position={index + 1}
                  first={index === 0}
                  last={index === state.exercises.length - 1}
                  onMove={(direction) =>
                    dispatch({
                      type: "exercise-moved",
                      id: exercise.id,
                      direction,
                    })
                  }
                  onRemove={() => {
                    if (
                      exercise.sets.length > 0 &&
                      !window.confirm(
                        `Remove ${exercise.displayName} and its logged sets?`,
                      )
                    ) {
                      return;
                    }

                    dispatch({
                      type: "exercise-removed",
                      id: exercise.id,
                    });
                  }}
                  onAddSet={() =>
                    dispatch({
                      type: "set-added",
                      exerciseId: exercise.id,
                      setId: crypto.randomUUID(),
                    })
                  }
                  onRemoveSet={(setId) =>
                    dispatch({
                      type: "set-removed",
                      exerciseId: exercise.id,
                      setId,
                    })
                  }
                  onSetValueChange={(setId, field, value) =>
                    dispatch({
                      type: "set-value-changed",
                      exerciseId: exercise.id,
                      setId,
                      field,
                      value,
                    })
                  }
                  onSetNotesChange={(setId, notes) =>
                    dispatch({
                      type: "set-notes-changed",
                      exerciseId: exercise.id,
                      setId,
                      notes,
                    })
                  }
                  onToggleSet={(setId) =>
                    dispatch({
                      type: "set-completion-toggled",
                      exerciseId: exercise.id,
                      setId,
                      completedAt: new Date().toISOString(),
                    })
                  }
                  onCopyPrevious={(setId) =>
                    dispatch({
                      type: "previous-values-copied",
                      exerciseId: exercise.id,
                      setId,
                    })
                  }
                />
              ))}
            </ol>
          )}
        </div>

        <aside className="space-y-5 lg:sticky lg:top-6 lg:self-start">
          <div className="rounded-2xl border border-white/10 bg-slate-900/80 p-5">
            <h2 className="font-bold">Session notes</h2>
            <label htmlFor="workout-notes" className="sr-only">
              Private workout notes
            </label>
            <textarea
              id="workout-notes"
              value={state.notes}
              onChange={(event) =>
                dispatch({
                  type: "notes-changed",
                  notes: event.target.value,
                })
              }
              maxLength={2000}
              rows={5}
              placeholder="How did the session feel?"
              className="mt-3 w-full resize-y rounded-xl border border-white/10 bg-slate-950 p-3 text-sm placeholder:text-slate-600"
            />
            <p className="mt-2 text-right text-xs text-slate-500">
              {state.notes.length}/2000
            </p>
          </div>

          <div className="rounded-2xl border border-white/10 p-5">
            <h2 className="font-bold">Ready to finish?</h2>
            <ul className="mt-3 space-y-3 text-sm text-slate-300">
              <ReadinessItem
                ready={state.exercises.length > 0}
                label="At least one exercise"
              />
              <ReadinessItem
                ready={completedSetCount > 0}
                label="At least one completed set"
              />
            </ul>
            <p className="mt-4 text-xs leading-5 text-slate-500">
              Only completed sets contribute to completed workout volume.
            </p>
          </div>
        </aside>
      </div>

      <div className="fixed inset-x-0 bottom-0 z-20 border-t border-white/10 bg-slate-950/95 px-4 py-3 shadow-2xl backdrop-blur sm:px-6">
        <div className="mx-auto flex w-full max-w-7xl items-center justify-between gap-4">
          <p className="hidden text-sm text-slate-400 sm:block">
            {state.dirty
              ? "Unsaved workout changes"
              : "Add an exercise to begin"}
          </p>
          <button
            type="button"
            disabled={state.status === "saving"}
            onClick={() => void completeWorkout()}
            className="min-h-12 w-full rounded-xl bg-white px-6 py-3 font-bold text-slate-950 hover:bg-slate-200 disabled:cursor-wait disabled:opacity-60 sm:ml-auto sm:w-auto"
          >
            {state.status === "saving"
              ? "Saving workout..."
              : "Complete workout"}
          </button>
        </div>
      </div>

      {pickerOpen && (
        <ExercisePicker
          addedCodes={
            new Set(state.exercises.map((exercise) => exercise.exerciseCode))
          }
          onAdd={addExercise}
          onClose={closePicker}
        />
      )}

      {recoveryCandidate && (
        <RecoveryDialog
          savedAt={recoveryCandidate.savedAt}
          draft={recoveryCandidate.draft}
          onResume={() => {
            dispatch({
              type: "draft-recovered",
              draft: recoveryCandidate.draft,
            });
            setRecoveryCandidate(null);
          }}
          onDiscard={() => {
            clearActiveWorkoutDraft(draftOwnerKey);
            setRecoveryCandidate(null);
          }}
        />
      )}
    </section>
  );
}

function EmptyWorkout({ onAdd }: { onAdd: () => void }) {
  return (
    <div className="mt-5 rounded-2xl border border-dashed border-white/15 bg-white/[0.025] px-6 py-14 text-center">
      <div className="mx-auto flex size-14 items-center justify-center rounded-2xl bg-emerald-300/10 text-emerald-300">
        <DumbbellIcon />
      </div>
      <h2 className="mt-5 text-xl font-bold">Start with your first exercise</h2>
      <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-400">
        Choose movements in training order. You can rearrange or remove them
        before saving the workout.
      </p>
      <button
        type="button"
        onClick={onAdd}
        className="mt-6 min-h-11 rounded-lg border border-emerald-300/30 px-4 py-2 font-semibold text-emerald-200 hover:bg-emerald-300/10"
      >
        Browse exercises
      </button>
    </div>
  );
}

function ExerciseCard({
  exercise,
  position,
  first,
  last,
  onMove,
  onRemove,
  onAddSet,
  onRemoveSet,
  onSetValueChange,
  onSetNotesChange,
  onToggleSet,
  onCopyPrevious,
}: {
  exercise: WorkoutExerciseDraft;
  position: number;
  first: boolean;
  last: boolean;
  onMove: (direction: "up" | "down") => void;
  onRemove: () => void;
  onAddSet: () => void;
  onRemoveSet: (setId: string) => void;
  onSetValueChange: (
    setId: string,
    field: "weightKg" | "repetitions",
    value: string,
  ) => void;
  onSetNotesChange: (setId: string, notes: string) => void;
  onToggleSet: (setId: string) => void;
  onCopyPrevious: (setId: string) => void;
}) {
  return (
    <li className="rounded-2xl border border-white/10 bg-slate-900/70">
      <div className="flex items-center gap-3 border-b border-white/10 p-4 sm:p-5">
        <span
          aria-hidden="true"
          className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-white/5 text-sm font-bold text-slate-400"
        >
          {position}
        </span>
        <div className="min-w-0 flex-1">
          <h3 className="truncate font-bold sm:text-lg">
            {exercise.displayName}
          </h3>
          <p className="mt-0.5 text-xs text-slate-500">
            {exercise.exerciseCode}
          </p>
          {exercise.previousStatus === "loading" && (
            <p className="mt-1 text-xs text-slate-500">
              Loading previous performance…
            </p>
          )}
          {exercise.previousStatus === "empty" && (
            <p className="mt-1 text-xs text-slate-500">
              No previous completed sets
            </p>
          )}
          {exercise.previousStatus === "error" && (
            <p className="mt-1 text-xs text-amber-300">
              Previous values unavailable
            </p>
          )}
        </div>
        <div className="flex items-center gap-1">
          <button
            type="button"
            disabled={first}
            onClick={() => onMove("up")}
            aria-label={`Move ${exercise.displayName} up`}
            className="flex size-11 items-center justify-center rounded-lg text-slate-300 hover:bg-white/10 disabled:opacity-25"
          >
            <ArrowUpIcon />
          </button>
          <button
            type="button"
            disabled={last}
            onClick={() => onMove("down")}
            aria-label={`Move ${exercise.displayName} down`}
            className="flex size-11 items-center justify-center rounded-lg text-slate-300 hover:bg-white/10 disabled:opacity-25"
          >
            <ArrowDownIcon />
          </button>
          <button
            type="button"
            onClick={onRemove}
            aria-label={`Remove ${exercise.displayName}`}
            className="flex size-11 items-center justify-center rounded-lg text-red-200 hover:bg-red-300/10"
          >
            <TrashIcon />
          </button>
        </div>
      </div>
      <SetTable
        exercise={exercise}
        onAdd={onAddSet}
        onRemove={onRemoveSet}
        onValueChange={onSetValueChange}
        onNotesChange={onSetNotesChange}
        onToggle={onToggleSet}
        onCopyPrevious={onCopyPrevious}
      />
    </li>
  );
}

function SetTable({
  exercise,
  onAdd,
  onRemove,
  onValueChange,
  onNotesChange,
  onToggle,
  onCopyPrevious,
}: {
  exercise: WorkoutExerciseDraft;
  onAdd: () => void;
  onRemove: (setId: string) => void;
  onValueChange: (
    setId: string,
    field: "weightKg" | "repetitions",
    value: string,
  ) => void;
  onNotesChange: (setId: string, notes: string) => void;
  onToggle: (setId: string) => void;
  onCopyPrevious: (setId: string) => void;
}) {
  return (
    <div className="p-3 sm:p-5">
      <div
        aria-hidden="true"
        className="mb-2 hidden grid-cols-[2.5rem_6rem_minmax(5rem,1fr)_minmax(4.5rem,0.8fr)_3rem_3rem] gap-2 px-1 text-xs font-semibold tracking-wide text-slate-500 uppercase sm:grid"
      >
        <span>Set</span>
        <span>Previous</span>
        <span>kg</span>
        <span>Reps</span>
        <span className="text-center">Done</span>
        <span />
      </div>

      <div className="space-y-2">
        {exercise.sets.map((set, index) => (
          <SetRow
            key={set.id}
            exerciseName={exercise.displayName}
            set={set}
            position={index + 1}
            onlySet={exercise.sets.length === 1}
            onRemove={() => onRemove(set.id)}
            onValueChange={(field, value) =>
              onValueChange(set.id, field, value)
            }
            onNotesChange={(notes) => onNotesChange(set.id, notes)}
            onToggle={() => onToggle(set.id)}
            onCopyPrevious={() => onCopyPrevious(set.id)}
          />
        ))}
      </div>

      <button
        type="button"
        onClick={onAdd}
        className="mt-3 inline-flex min-h-11 items-center gap-2 rounded-lg px-3 text-sm font-semibold text-emerald-300 hover:bg-emerald-300/10"
      >
        <PlusIcon />
        Add set
      </button>
    </div>
  );
}

function SetRow({
  exerciseName,
  set,
  position,
  onlySet,
  onRemove,
  onValueChange,
  onNotesChange,
  onToggle,
  onCopyPrevious,
}: {
  exerciseName: string;
  set: WorkoutSetDraft;
  position: number;
  onlySet: boolean;
  onRemove: () => void;
  onValueChange: (field: "weightKg" | "repetitions", value: string) => void;
  onNotesChange: (notes: string) => void;
  onToggle: () => void;
  onCopyPrevious: () => void;
}) {
  const validation = validateSet(set);
  const weightError =
    set.showValidation || set.weightKg !== "" ? validation.weightKg : null;
  const repetitionsError =
    set.showValidation || set.repetitions !== ""
      ? validation.repetitions
      : null;
  const weightErrorId = `${set.id}-weight-error`;
  const repetitionsErrorId = `${set.id}-repetitions-error`;
  const complete = set.completedAt !== null;

  return (
    <div
      className={`rounded-xl border p-2 ${
        complete
          ? "border-emerald-300/35 bg-emerald-300/[0.06]"
          : "border-white/5 bg-slate-950/60"
      }`}
    >
      <div className="grid grid-cols-[2.5rem_minmax(5rem,1fr)_minmax(4.5rem,0.8fr)_3rem_3rem] items-start gap-2 sm:grid-cols-[2.5rem_6rem_minmax(5rem,1fr)_minmax(4.5rem,0.8fr)_3rem_3rem]">
        <span className="flex min-h-11 items-center justify-center text-sm font-bold text-slate-400">
          {position}
        </span>

        <div className="hidden min-h-11 items-center text-sm text-slate-500 sm:flex">
          {set.previous ? (
            <button
              type="button"
              onClick={onCopyPrevious}
              title="Copy previous values"
              className="min-h-11 rounded-lg px-2 text-left text-emerald-200 hover:bg-emerald-300/10"
            >
              {set.previous.weightKg} × {set.previous.repetitions}
            </button>
          ) : (
            "—"
          )}
        </div>

        <div>
          <label htmlFor={`${set.id}-weight`} className="sr-only">
            {exerciseName} set {position} weight in kilograms
          </label>
          <input
            id={`${set.id}-weight`}
            type="number"
            inputMode="decimal"
            min="0"
            max="2000"
            step="0.001"
            value={set.weightKg}
            onChange={(event) => onValueChange("weightKg", event.target.value)}
            aria-invalid={weightError ? "true" : undefined}
            aria-describedby={weightError ? weightErrorId : undefined}
            placeholder="kg"
            className="min-h-11 w-full rounded-lg border border-white/10 bg-slate-900 px-3 text-sm placeholder:text-slate-600"
          />
          {weightError && (
            <p id={weightErrorId} className="mt-1 text-xs text-red-300">
              {weightError}
            </p>
          )}
        </div>

        <div>
          <label htmlFor={`${set.id}-repetitions`} className="sr-only">
            {exerciseName} set {position} repetitions
          </label>
          <input
            id={`${set.id}-repetitions`}
            type="number"
            inputMode="numeric"
            min="1"
            max="1000"
            step="1"
            value={set.repetitions}
            onChange={(event) =>
              onValueChange("repetitions", event.target.value)
            }
            aria-invalid={repetitionsError ? "true" : undefined}
            aria-describedby={repetitionsError ? repetitionsErrorId : undefined}
            placeholder="reps"
            className="min-h-11 w-full rounded-lg border border-white/10 bg-slate-900 px-3 text-sm placeholder:text-slate-600"
          />
          {repetitionsError && (
            <p id={repetitionsErrorId} className="mt-1 text-xs text-red-300">
              {repetitionsError}
            </p>
          )}
        </div>

        <button
          type="button"
          aria-pressed={complete}
          aria-label={`${complete ? "Mark incomplete" : "Complete"} ${exerciseName} set ${position}`}
          onClick={onToggle}
          className={`flex size-11 items-center justify-center rounded-lg border ${
            complete
              ? "border-emerald-300 bg-emerald-300 text-slate-950"
              : "border-white/15 text-slate-500 hover:border-emerald-300/50 hover:text-emerald-300"
          }`}
        >
          {complete && <SmallCheckIcon />}
        </button>

        <button
          type="button"
          disabled={onlySet}
          onClick={onRemove}
          aria-label={`Remove ${exerciseName} set ${position}`}
          title={
            onlySet ? "Each exercise requires at least one set" : undefined
          }
          className="flex size-11 items-center justify-center rounded-lg text-slate-500 hover:bg-red-300/10 hover:text-red-200 disabled:cursor-not-allowed disabled:opacity-25"
        >
          <TrashIcon />
        </button>
      </div>

      <details className="mt-1">
        <summary className="inline-flex min-h-11 cursor-pointer items-center rounded-lg px-2 text-xs font-semibold text-slate-500 hover:text-slate-300">
          {set.notes ? "Edit set note" : "Add set note"}
        </summary>
        <label htmlFor={`${set.id}-notes`} className="sr-only">
          {exerciseName} set {position} notes
        </label>
        <textarea
          id={`${set.id}-notes`}
          value={set.notes}
          onChange={(event) => onNotesChange(event.target.value)}
          maxLength={500}
          rows={2}
          placeholder="Optional private note"
          className="mt-1 w-full resize-y rounded-lg border border-white/10 bg-slate-900 p-3 text-sm placeholder:text-slate-600"
        />
      </details>
    </div>
  );
}

function RecoveryDialog({
  savedAt,
  draft,
  onResume,
  onDiscard,
}: {
  savedAt: string;
  draft: RecoverableWorkoutDraft;
  onResume: () => void;
  onDiscard: () => void;
}) {
  const resumeButtonRef = useRef<HTMLButtonElement>(null);
  const setCount = draft.exercises.reduce(
    (total, exercise) => total + exercise.sets.length,
    0,
  );

  useEffect(() => {
    resumeButtonRef.current?.focus();
  }, []);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/85 p-4 backdrop-blur-sm">
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="recovery-dialog-title"
        aria-describedby="recovery-dialog-description"
        className="w-full max-w-lg rounded-3xl border border-emerald-300/25 bg-slate-900 p-6 shadow-2xl sm:p-8"
      >
        <span className="inline-flex size-12 items-center justify-center rounded-2xl bg-emerald-300/10 text-emerald-300">
          <RecoveryIcon />
        </span>
        <h2 id="recovery-dialog-title" className="mt-5 text-2xl font-bold">
          Resume your workout?
        </h2>
        <p
          id="recovery-dialog-description"
          className="mt-2 leading-7 text-slate-300"
        >
          An interrupted workout was recovered from this browser. Resume it or
          discard it and start a new session.
        </p>

        <dl className="mt-6 grid grid-cols-3 gap-3">
          <RecoveryMetric label="Exercises" value={draft.exercises.length} />
          <RecoveryMetric label="Sets" value={setCount} />
          <RecoveryMetric
            label="Saved"
            value={new Intl.DateTimeFormat("en", {
              month: "short",
              day: "numeric",
              hour: "numeric",
              minute: "2-digit",
            }).format(new Date(savedAt))}
          />
        </dl>

        <div className="mt-7 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
          <button
            type="button"
            onClick={onDiscard}
            className="min-h-11 rounded-xl border border-red-300/25 px-5 py-2 font-semibold text-red-200 hover:bg-red-300/10"
          >
            Discard recovered draft
          </button>
          <button
            ref={resumeButtonRef}
            type="button"
            onClick={onResume}
            className="min-h-11 rounded-xl bg-emerald-300 px-5 py-2 font-bold text-slate-950 hover:bg-emerald-200"
          >
            Resume workout
          </button>
        </div>
      </div>
    </div>
  );
}

function RecoveryMetric({
  label,
  value,
}: {
  label: string;
  value: string | number;
}) {
  return (
    <div className="rounded-xl border border-white/10 bg-slate-950/60 p-3">
      <dt className="text-xs text-slate-500">{label}</dt>
      <dd className="mt-1 truncate text-sm font-bold">{value}</dd>
    </div>
  );
}

function ExercisePicker({
  addedCodes,
  onAdd,
  onClose,
}: {
  addedCodes: ReadonlySet<string>;
  onAdd: (exercise: ExerciseCatalogItem) => void;
  onClose: () => void;
}) {
  const [query, setQuery] = useState("");
  const dialogRef = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLInputElement>(null);
  const filteredExercises = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();

    if (!normalizedQuery) {
      return exerciseCatalog;
    }

    return exerciseCatalog.filter((exercise) =>
      `${exercise.name} ${exercise.category}`
        .toLowerCase()
        .includes(normalizedQuery),
    );
  }, [query]);

  useEffect(() => {
    searchRef.current?.focus();
  }, []);

  const handleKeyDown = (event: React.KeyboardEvent<HTMLDivElement>) => {
    if (event.key === "Escape") {
      event.preventDefault();
      onClose();
      return;
    }

    if (event.key !== "Tab") {
      return;
    }

    const focusable = Array.from(
      dialogRef.current?.querySelectorAll<HTMLElement>(
        'button:not([disabled]), input:not([disabled]), [href], [tabindex]:not([tabindex="-1"])',
      ) ?? [],
    );

    if (focusable.length === 0) {
      return;
    }

    const first = focusable[0];
    const last = focusable[focusable.length - 1];

    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first.focus();
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-slate-950/80 p-0 backdrop-blur-sm sm:items-center sm:p-6"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) {
          onClose();
        }
      }}
    >
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="exercise-picker-title"
        onKeyDown={handleKeyDown}
        className="max-h-[90vh] w-full max-w-2xl overflow-hidden rounded-t-3xl border border-white/10 bg-slate-900 shadow-2xl sm:rounded-3xl"
      >
        <div className="flex items-start justify-between gap-4 border-b border-white/10 p-5 sm:p-6">
          <div>
            <h2 id="exercise-picker-title" className="text-xl font-bold">
              Add an exercise
            </h2>
            <p className="mt-1 text-sm text-slate-400">
              Choose from the starter strength catalog.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close exercise picker"
            className="flex size-11 shrink-0 items-center justify-center rounded-xl hover:bg-white/10"
          >
            <CloseIcon />
          </button>
        </div>

        <div className="p-5 sm:p-6">
          <label htmlFor="exercise-search" className="sr-only">
            Search exercises
          </label>
          <div className="relative">
            <span className="pointer-events-none absolute inset-y-0 left-4 flex items-center text-slate-500">
              <SearchIcon />
            </span>
            <input
              ref={searchRef}
              id="exercise-search"
              type="search"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search by exercise or muscle area"
              className="min-h-12 w-full rounded-xl border border-white/10 bg-slate-950 pr-4 pl-11 placeholder:text-slate-600"
            />
          </div>
        </div>

        <div className="max-h-[55vh] overflow-y-auto px-5 pb-6 sm:px-6">
          {filteredExercises.length === 0 ? (
            <p className="rounded-xl border border-dashed border-white/10 p-8 text-center text-sm text-slate-400">
              No exercises match that search.
            </p>
          ) : (
            <ul className="grid gap-2 sm:grid-cols-2">
              {filteredExercises.map((exercise) => {
                const added = addedCodes.has(exercise.code);

                return (
                  <li key={exercise.code}>
                    <button
                      type="button"
                      disabled={added}
                      onClick={() => onAdd(exercise)}
                      className="flex min-h-16 w-full items-center justify-between gap-3 rounded-xl border border-white/10 p-4 text-left hover:border-emerald-300/40 hover:bg-emerald-300/5 disabled:cursor-not-allowed disabled:opacity-45"
                    >
                      <span>
                        <span className="block font-semibold">
                          {exercise.name}
                        </span>
                        <span className="mt-1 block text-xs text-slate-500">
                          {exercise.category}
                        </span>
                      </span>
                      <span className="text-xs font-semibold text-emerald-300">
                        {added ? "Added" : "Add"}
                      </span>
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}

function CompletedWorkoutView({
  workout,
  onStartAnother,
}: {
  workout: {
    durationSeconds: number;
    exerciseCount: number;
    completedSetCount: number;
  };
  onStartAnother: () => void;
}) {
  return (
    <section className="m-auto w-full max-w-2xl rounded-3xl border border-emerald-300/25 bg-emerald-300/5 p-8 text-center sm:p-12">
      <div className="mx-auto flex size-16 items-center justify-center rounded-full bg-emerald-300 text-slate-950">
        <CheckIcon />
      </div>
      <p className="mt-6 text-sm font-bold tracking-widest text-emerald-300 uppercase">
        Workout saved
      </p>
      <h1 className="mt-2 text-3xl font-bold">Session complete</h1>
      <div className="mt-8 grid grid-cols-3 gap-3">
        <Metric
          label="Duration"
          value={formatDuration(workout.durationSeconds)}
        />
        <Metric label="Exercises" value={workout.exerciseCount} />
        <Metric label="Completed sets" value={workout.completedSetCount} />
      </div>
      <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
        <Link
          href="/dashboard"
          className="inline-flex min-h-11 items-center justify-center rounded-lg bg-white px-5 py-2 font-bold text-slate-950"
        >
          Return to dashboard
        </Link>
        <button
          type="button"
          onClick={onStartAnother}
          className="min-h-11 rounded-lg border border-white/15 px-5 py-2 font-semibold"
        >
          Start another workout
        </button>
      </div>
    </section>
  );
}

function Metric({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-xl border border-white/10 bg-white/[0.035] p-3 sm:p-4">
      <p className="truncate text-xs text-slate-500">{label}</p>
      <p className="mt-1 truncate text-lg font-bold sm:text-xl">{value}</p>
    </div>
  );
}

function ReadinessItem({ ready, label }: { ready: boolean; label: string }) {
  return (
    <li className="flex items-center gap-3">
      <span
        className={`flex size-6 items-center justify-center rounded-full ${
          ready
            ? "bg-emerald-300 text-slate-950"
            : "border border-white/15 text-slate-600"
        }`}
      >
        {ready && <SmallCheckIcon />}
      </span>
      {label}
    </li>
  );
}

function useElapsedSeconds(startedAt: string) {
  const [elapsedSeconds, setElapsedSeconds] = useState(0);

  useEffect(() => {
    const update = () => {
      setElapsedSeconds(
        Math.max(
          0,
          Math.floor((Date.now() - new Date(startedAt).getTime()) / 1000),
        ),
      );
    };

    update();
    const timer = window.setInterval(update, 1000);
    return () => window.clearInterval(timer);
  }, [startedAt]);

  return elapsedSeconds;
}

function formatDuration(totalSeconds: number) {
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  return [hours, minutes, seconds]
    .map((value) => value.toString().padStart(2, "0"))
    .join(":");
}

function formatVolume(volume: number) {
  return `${new Intl.NumberFormat("en", {
    maximumFractionDigits: 1,
  }).format(volume)} kg·reps`;
}

function optionalText(value: string) {
  const normalized = value.trim();
  return normalized ? normalized : undefined;
}

function Icon({
  children,
  className = "size-5",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      {children}
    </svg>
  );
}

function ArrowLeftIcon() {
  return (
    <Icon>
      <path d="m15 18-6-6 6-6" />
    </Icon>
  );
}

function PlusIcon() {
  return (
    <Icon>
      <path d="M12 5v14M5 12h14" />
    </Icon>
  );
}

function CloseIcon() {
  return (
    <Icon>
      <path d="m6 6 12 12M18 6 6 18" />
    </Icon>
  );
}

function ArrowUpIcon() {
  return (
    <Icon>
      <path d="m18 15-6-6-6 6" />
    </Icon>
  );
}

function ArrowDownIcon() {
  return (
    <Icon>
      <path d="m6 9 6 6 6-6" />
    </Icon>
  );
}

function TrashIcon() {
  return (
    <Icon>
      <path d="M3 6h18M8 6V4h8v2M19 6l-1 14H6L5 6M10 11v5M14 11v5" />
    </Icon>
  );
}

function SearchIcon() {
  return (
    <Icon>
      <circle cx="11" cy="11" r="7" />
      <path d="m20 20-4-4" />
    </Icon>
  );
}

function DumbbellIcon() {
  return (
    <Icon className="size-7">
      <path d="M6.5 6.5v11M3.5 9v6M17.5 6.5v11M20.5 9v6M6.5 12h11" />
    </Icon>
  );
}

function CheckIcon() {
  return (
    <Icon className="size-8">
      <path d="m5 12 4 4L19 6" />
    </Icon>
  );
}

function SmallCheckIcon() {
  return (
    <Icon className="size-4">
      <path d="m5 12 4 4L19 6" />
    </Icon>
  );
}

function RecoveryIcon() {
  return (
    <Icon>
      <path d="M4 4v6h6" />
      <path d="M5.5 15a8 8 0 1 0 .5-7.5L4 10" />
    </Icon>
  );
}
