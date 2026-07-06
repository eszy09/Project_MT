import type {
  ActiveWorkoutState,
  WorkoutExerciseDraft,
  WorkoutSetDraft,
} from "./active-workout-state";

const DRAFT_VERSION = 1;
const DRAFT_TTL_MS = 7 * 24 * 60 * 60 * 1000;
const MAX_DRAFT_BYTES = 500_000;
const STORAGE_PREFIX = "project-mt.active-workout";

export type RecoverableWorkoutDraft = Pick<
  ActiveWorkoutState,
  "startedAt" | "completionKey" | "notes" | "exercises"
>;

type StoredWorkoutDraft = {
  version: typeof DRAFT_VERSION;
  savedAt: string;
  draft: RecoverableWorkoutDraft;
};

export type DraftLoadResult =
  | { status: "none" }
  | { status: "unavailable" }
  | {
      status: "available";
      savedAt: string;
      draft: RecoverableWorkoutDraft;
    };

export function loadActiveWorkoutDraft(
  ownerKey: string,
  now = Date.now(),
): DraftLoadResult {
  const storage = browserStorage();

  if (!storage) {
    return { status: "unavailable" };
  }

  const key = storageKey(ownerKey);
  let serialized: string | null;

  try {
    serialized = storage.getItem(key);
  } catch {
    return { status: "unavailable" };
  }

  if (!serialized) {
    return { status: "none" };
  }

  if (serialized.length > MAX_DRAFT_BYTES) {
    removeSafely(storage, key);
    return { status: "none" };
  }

  try {
    const stored = JSON.parse(serialized) as unknown;

    if (!isStoredWorkoutDraft(stored)) {
      removeSafely(storage, key);
      return { status: "none" };
    }

    const savedAt = Date.parse(stored.savedAt);

    if (
      !Number.isFinite(savedAt) ||
      savedAt > now + 60_000 ||
      now - savedAt > DRAFT_TTL_MS
    ) {
      removeSafely(storage, key);
      return { status: "none" };
    }

    return {
      status: "available",
      savedAt: stored.savedAt,
      draft: stored.draft,
    };
  } catch {
    removeSafely(storage, key);
    return { status: "none" };
  }
}

export function saveActiveWorkoutDraft(
  ownerKey: string,
  state: ActiveWorkoutState,
  savedAt = new Date().toISOString(),
) {
  const storage = browserStorage();

  if (!storage) {
    return false;
  }

  const stored: StoredWorkoutDraft = {
    version: DRAFT_VERSION,
    savedAt,
    draft: {
      startedAt: state.startedAt,
      completionKey: state.completionKey,
      notes: state.notes,
      exercises: state.exercises.map((exercise) => ({
        ...exercise,
        sets: exercise.sets.map((set) => ({
          ...set,
          showValidation: false,
        })),
      })),
    },
  };

  try {
    storage.setItem(storageKey(ownerKey), JSON.stringify(stored));
    return true;
  } catch {
    return false;
  }
}

export function clearActiveWorkoutDraft(ownerKey: string) {
  const storage = browserStorage();

  if (!storage) {
    return false;
  }

  try {
    storage.removeItem(storageKey(ownerKey));
    return true;
  } catch {
    return false;
  }
}

export function activeWorkoutStorageKey(ownerKey: string) {
  return storageKey(ownerKey);
}

function storageKey(ownerKey: string) {
  return `${STORAGE_PREFIX}.v${DRAFT_VERSION}.${ownerKey}`;
}

function browserStorage() {
  if (typeof window === "undefined") {
    return null;
  }

  try {
    return window.localStorage;
  } catch {
    return null;
  }
}

function removeSafely(storage: Storage, key: string) {
  try {
    storage.removeItem(key);
  } catch {
    // An unavailable storage backend is handled as an empty draft.
  }
}

function isStoredWorkoutDraft(value: unknown): value is StoredWorkoutDraft {
  if (!isRecord(value)) {
    return false;
  }

  return (
    value.version === DRAFT_VERSION &&
    isIsoDate(value.savedAt) &&
    isRecoverableWorkoutDraft(value.draft)
  );
}

function isRecoverableWorkoutDraft(
  value: unknown,
): value is RecoverableWorkoutDraft {
  if (!isRecord(value)) {
    return false;
  }

  return (
    isIsoDate(value.startedAt) &&
    isCompletionKey(value.completionKey) &&
    isBoundedString(value.notes, 2_000) &&
    Array.isArray(value.exercises) &&
    value.exercises.length <= 100 &&
    value.exercises.every(isWorkoutExerciseDraft)
  );
}

function isWorkoutExerciseDraft(value: unknown): value is WorkoutExerciseDraft {
  if (!isRecord(value)) {
    return false;
  }

  return (
    isBoundedString(value.id, 100) &&
    isBoundedString(value.exerciseCode, 100) &&
    isBoundedString(value.displayName, 150) &&
    isBoundedString(value.notes, 2_000) &&
    Array.isArray(value.sets) &&
    value.sets.length > 0 &&
    value.sets.length <= 100 &&
    value.sets.every(isWorkoutSetDraft)
  );
}

function isWorkoutSetDraft(value: unknown): value is WorkoutSetDraft {
  if (!isRecord(value)) {
    return false;
  }

  return (
    isBoundedString(value.id, 100) &&
    (value.previous === null || isPreviousPerformance(value.previous)) &&
    isBoundedString(value.weightKg, 30) &&
    isBoundedString(value.repetitions, 30) &&
    (value.completedAt === null || isIsoDate(value.completedAt)) &&
    isBoundedString(value.notes, 500) &&
    typeof value.showValidation === "boolean"
  );
}

function isPreviousPerformance(value: unknown) {
  return (
    isRecord(value) &&
    isBoundedString(value.weightKg, 30) &&
    isBoundedString(value.repetitions, 30)
  );
}

function isCompletionKey(value: unknown) {
  return (
    typeof value === "string" &&
    /^[A-Za-z0-9][A-Za-z0-9._:-]{7,99}$/.test(value)
  );
}

function isIsoDate(value: unknown) {
  return typeof value === "string" && Number.isFinite(Date.parse(value));
}

function isBoundedString(value: unknown, maximumLength: number) {
  return typeof value === "string" && value.length <= maximumLength;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}
