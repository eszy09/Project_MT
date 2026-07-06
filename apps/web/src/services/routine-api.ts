import "server-only";

import type { components } from "@project-mt/api-contract";
import { auth0 } from "@/lib/auth0";

export type Routine = components["schemas"]["RoutineResponse"];
export type RoutineInput = components["schemas"]["RoutineRequest"];

const path = "/api/v1/routines";

export async function listRoutines(includeArchived = true): Promise<Routine[]> {
  return request(`${path}?includeArchived=${includeArchived}`, "GET");
}
export async function getRoutine(id: string): Promise<Routine> {
  return request(`${path}/${encodeURIComponent(id)}`, "GET");
}
export async function createRoutine(input: RoutineInput): Promise<Routine> {
  return request(path, "POST", input);
}
export async function updateRoutine(
  id: string,
  version: number,
  input: RoutineInput,
): Promise<Routine> {
  return request(
    `${path}/${encodeURIComponent(id)}?version=${version}`,
    "PUT",
    input,
  );
}
export async function archiveRoutine(
  id: string,
  version: number,
  restore = false,
): Promise<Routine> {
  return request(
    `${path}/${encodeURIComponent(id)}/${restore ? "restore" : "archive"}?version=${version}`,
    "POST",
  );
}
export async function deleteRoutine(id: string): Promise<void> {
  await request(`${path}/${encodeURIComponent(id)}`, "DELETE");
}

async function request<T>(
  route: string,
  method: string,
  body?: unknown,
): Promise<T> {
  const { token } = await auth0.getAccessToken();
  const response = await fetch(
    `${process.env.API_BASE_URL ?? "http://localhost:8080"}${route}`,
    {
      method,
      cache: "no-store",
      headers: {
        Authorization: `Bearer ${token}`,
        "X-Request-ID": crypto.randomUUID(),
        ...(body ? { "Content-Type": "application/json" } : {}),
      },
      body: body ? JSON.stringify(body) : undefined,
    },
  );
  if (!response.ok) {
    const problem = (await response.json().catch(() => null)) as {
      detail?: string;
    } | null;
    throw new Error(problem?.detail ?? "Routine request failed.");
  }
  return response.status === 204
    ? (undefined as T)
    : ((await response.json()) as T);
}
