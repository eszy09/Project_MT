import "server-only";

import type { components } from "@project-mt/api-contract";
import { auth0 } from "@/lib/auth0";
import {
  WorkoutApiError,
  getWorkoutHistory,
  type WorkoutHistoryItem,
} from "./workout-api";

export type BodyCheckin = components["schemas"]["BodyCheckinResponse"];
export type BodyCheckinInput = components["schemas"]["BodyCheckinRequest"];

export class ProgressApiError extends Error {
  constructor(
    message: string,
    readonly status: number,
    readonly requestId: string,
  ) {
    super(message);
    this.name = "ProgressApiError";
  }
}

export async function createBodyCheckin(
  input: BodyCheckinInput,
): Promise<BodyCheckin> {
  const { token } = await auth0.getAccessToken();
  const requestId = crypto.randomUUID();
  let response: Response;

  try {
    response = await fetch(
      `${process.env.API_BASE_URL ?? "http://localhost:8080"}/api/v1/checkins`,
      {
        method: "POST",
        cache: "no-store",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
          "X-Request-ID": requestId,
        },
        body: JSON.stringify(input),
      },
    );
  } catch {
    throw new ProgressApiError(
      "Progress check-ins could not be reached.",
      503,
      requestId,
    );
  }

  const correlatedRequestId = response.headers.get("X-Request-ID") ?? requestId;
  if (!response.ok) {
    const problem = (await response.json().catch(() => null)) as {
      detail?: string;
    } | null;
    throw new ProgressApiError(
      problem?.detail ?? "Progress check-in could not be saved.",
      response.status,
      correlatedRequestId,
    );
  }

  return (await response.json()) as BodyCheckin;
}
export async function getProgressSourceData(
  from: string,
  to: string,
): Promise<{
  checkins: readonly BodyCheckin[];
  workouts: readonly WorkoutHistoryItem[];
}> {
  try {
    const [checkins, workouts] = await Promise.all([
      getBodyCheckins(),
      getAllWorkoutHistory(from, to),
    ]);
    return { checkins, workouts };
  } catch (error) {
    if (error instanceof WorkoutApiError) {
      throw new ProgressApiError(error.message, error.status, error.requestId);
    }
    throw error;
  }
}

async function getBodyCheckins(): Promise<readonly BodyCheckin[]> {
  const { token } = await auth0.getAccessToken();
  const requestId = crypto.randomUUID();
  let response: Response;

  try {
    response = await fetch(
      `${process.env.API_BASE_URL ?? "http://localhost:8080"}/api/v1/checkins`,
      {
        cache: "no-store",
        headers: {
          Authorization: `Bearer ${token}`,
          "X-Request-ID": requestId,
        },
      },
    );
  } catch {
    throw new ProgressApiError(
      "Progress check-ins could not be reached.",
      503,
      requestId,
    );
  }

  const correlatedRequestId = response.headers.get("X-Request-ID") ?? requestId;
  if (!response.ok) {
    const problem = (await response.json().catch(() => null)) as {
      detail?: string;
    } | null;
    throw new ProgressApiError(
      problem?.detail ?? "Progress check-ins could not be loaded.",
      response.status,
      correlatedRequestId,
    );
  }
  return (await response.json()) as readonly BodyCheckin[];
}

async function getAllWorkoutHistory(
  from: string,
  to: string,
): Promise<readonly WorkoutHistoryItem[]> {
  const workouts: WorkoutHistoryItem[] = [];
  let cursor: string | undefined;
  const seenCursors = new Set<string>();

  do {
    const result = await getWorkoutHistory({
      from,
      to,
      cursor,
      limit: 50,
    });
    workouts.push(...(result.items ?? []));
    cursor = result.nextCursor;
    if (cursor && seenCursors.has(cursor)) {
      throw new ProgressApiError(
        "Workout history returned a repeated page cursor.",
        502,
        crypto.randomUUID(),
      );
    }
    if (cursor) seenCursors.add(cursor);
  } while (cursor);
  return workouts;
}
