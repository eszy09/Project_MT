import "server-only";

import type { components } from "@project-mt/api-contract";
import { auth0 } from "@/lib/auth0";
import { logApiFailure } from "./telemetry";

export type WorkoutCompletionInput = components["schemas"]["WorkoutRequest"];
export type WorkoutHistoryPage =
  components["schemas"]["WorkoutHistoryPageResponse"];
export type WorkoutHistoryItem =
  components["schemas"]["WorkoutHistoryItemResponse"];
export type WorkoutDetail = components["schemas"]["WorkoutDetailResponse"];
export type PreviousPerformance =
  components["schemas"]["PreviousPerformanceResponse"];

type ApiWorkoutResponse = components["schemas"]["WorkoutResponse"];

export type SavedWorkoutResponse = {
  id: string;
  status: string;
  startedAt: string;
  completedAt: string;
  durationSeconds: number;
  exerciseCount: number;
  setCount: number;
  completedSetCount: number;
  createdAt: string;
};

type ApiProblem = {
  detail?: string;
};

const workoutPath = "/api/v1/workouts";

export class WorkoutApiError extends Error {
  constructor(
    message: string,
    readonly status: number,
    readonly requestId: string,
  ) {
    super(message);
    this.name = "WorkoutApiError";
  }
}

export async function saveCompletedWorkout(
  input: WorkoutCompletionInput,
  idempotencyKey: string,
): Promise<SavedWorkoutResponse> {
  const { token } = await auth0.getAccessToken();
  const baseUrl = process.env.API_BASE_URL ?? "http://localhost:8080";
  const requestId = crypto.randomUUID();
  const startedAt = Date.now();
  let response: Response;

  try {
    response = await fetch(`${baseUrl}${workoutPath}`, {
      method: "POST",
      cache: "no-store",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
        "Idempotency-Key": idempotencyKey,
        "X-Request-ID": requestId,
      },
      body: JSON.stringify(input),
    });
  } catch {
    logFailure(requestId, 0, startedAt);

    throw new WorkoutApiError(
      "The workout API could not be reached.",
      503,
      requestId,
    );
  }

  const correlatedRequestId = response.headers.get("X-Request-ID") ?? requestId;

  if (!response.ok) {
    const problem = (await response
      .json()
      .catch(() => null)) as ApiProblem | null;

    logFailure(correlatedRequestId, response.status, startedAt);

    throw new WorkoutApiError(
      problem?.detail ?? "The workout could not be saved.",
      response.status,
      correlatedRequestId,
    );
  }

  const workout = (await response.json()) as ApiWorkoutResponse;

  if (!isCompleteResponse(workout)) {
    logFailure(correlatedRequestId, 502, startedAt);

    throw new WorkoutApiError(
      "The workout API returned an incomplete response.",
      502,
      correlatedRequestId,
    );
  }

  return workout;
}

export async function getWorkoutHistory(filters: {
  cursor?: string;
  exerciseCode?: string;
  from?: string;
  to?: string;
  limit?: number;
}): Promise<WorkoutHistoryPage> {
  const parameters = new URLSearchParams();
  parameters.set("limit", String(filters.limit ?? 20));
  if (filters.cursor) parameters.set("cursor", filters.cursor);
  if (filters.exerciseCode) {
    parameters.set("exerciseCode", filters.exerciseCode);
  }
  if (filters.from) parameters.set("from", filters.from);
  if (filters.to) parameters.set("to", filters.to);

  return getWorkoutResource<WorkoutHistoryPage>(
    `${workoutPath}?${parameters}`,
    workoutPath,
  );
}

export async function getWorkoutDetail(
  workoutId: string,
): Promise<WorkoutDetail> {
  return getWorkoutResource<WorkoutDetail>(
    `${workoutPath}/${encodeURIComponent(workoutId)}`,
    `${workoutPath}/{workoutId}`,
  );
}

export async function getPreviousPerformance(
  exerciseCode: string,
): Promise<PreviousPerformance | null> {
  return getWorkoutResource<PreviousPerformance>(
    `${workoutPath}/previous/${encodeURIComponent(exerciseCode)}`,
    `${workoutPath}/previous/{exerciseCode}`,
    true,
  );
}

async function getWorkoutResource<T>(
  path: string,
  telemetryRoute: string,
  notFoundIsEmpty?: false,
): Promise<T>;
async function getWorkoutResource<T>(
  path: string,
  telemetryRoute: string,
  notFoundIsEmpty: true,
): Promise<T | null>;
async function getWorkoutResource<T>(
  path: string,
  telemetryRoute: string,
  notFoundIsEmpty = false,
): Promise<T | null> {
  const { token } = await auth0.getAccessToken();
  const baseUrl = process.env.API_BASE_URL ?? "http://localhost:8080";
  const requestId = crypto.randomUUID();
  const startedAt = Date.now();
  let response: Response;

  try {
    response = await fetch(`${baseUrl}${path}`, {
      cache: "no-store",
      headers: {
        Authorization: `Bearer ${token}`,
        "X-Request-ID": requestId,
      },
    });
  } catch {
    logApiFailure({
      requestId,
      method: "GET",
      route: telemetryRoute,
      status: 0,
      durationMs: Date.now() - startedAt,
    });
    throw new WorkoutApiError(
      "The workout API could not be reached.",
      503,
      requestId,
    );
  }

  const correlatedRequestId = response.headers.get("X-Request-ID") ?? requestId;
  if (notFoundIsEmpty && response.status === 404) {
    return null;
  }
  if (!response.ok) {
    const problem = (await response
      .json()
      .catch(() => null)) as ApiProblem | null;
    logApiFailure({
      requestId: correlatedRequestId,
      method: "GET",
      route: telemetryRoute,
      status: response.status,
      durationMs: Date.now() - startedAt,
    });
    throw new WorkoutApiError(
      problem?.detail ?? "Workout history could not be loaded.",
      response.status,
      correlatedRequestId,
    );
  }

  return (await response.json()) as T;
}

function isCompleteResponse(
  workout: ApiWorkoutResponse,
): workout is SavedWorkoutResponse {
  return (
    typeof workout.id === "string" &&
    typeof workout.status === "string" &&
    typeof workout.startedAt === "string" &&
    typeof workout.completedAt === "string" &&
    typeof workout.durationSeconds === "number" &&
    typeof workout.exerciseCount === "number" &&
    typeof workout.setCount === "number" &&
    typeof workout.completedSetCount === "number" &&
    typeof workout.createdAt === "string"
  );
}

function logFailure(requestId: string, status: number, startedAt: number) {
  logApiFailure({
    requestId,
    method: "POST",
    route: workoutPath,
    status,
    durationMs: Date.now() - startedAt,
  });
}
