import "server-only";

import { auth0 } from "@/lib/auth0";

export type PrimaryGoal =
  "BUILD_MUSCLE" | "LOSE_FAT" | "IMPROVE_STRENGTH" | "GENERAL_FITNESS";

export type TargetArea =
  | "CHEST"
  | "BACK"
  | "SHOULDERS"
  | "ARMS"
  | "CORE"
  | "GLUTES"
  | "LEGS"
  | "FULL_BODY";

export type ExperienceLevel = "BEGINNER" | "INTERMEDIATE" | "ADVANCED";

export type OnboardingDraft = {
  id: string;
  displayName: string;
  primaryGoal: PrimaryGoal | null;
  targetAreas: TargetArea[];
  experienceLevel: ExperienceLevel | null;
  heightCm: number | null;
  weightKg: number | null;
  onboardingStep: number;
  completed: boolean;
  completedAt: string | null;
  updatedAt: string;
};

type ApiProblem = {
  detail?: string;
};

const onboardingPath = "/api/v1/profile/onboarding";

export class OnboardingApiError extends Error {
  constructor(
    message: string,
    readonly status: number,
  ) {
    super(message);
    this.name = "OnboardingApiError";
  }
}

async function request<T>(path: string, init: RequestInit = {}): Promise<T> {
  const { token } = await auth0.getAccessToken();
  const baseUrl = process.env.API_BASE_URL ?? "http://localhost:8080";
  const response = await fetch(`${baseUrl}${onboardingPath}${path}`, {
    ...init,
    cache: "no-store",
    headers: {
      Authorization: `Bearer ${token}`,
      ...(init.body ? { "Content-Type": "application/json" } : {}),
      ...init.headers,
    },
  });

  if (!response.ok) {
    const problem = (await response
      .json()
      .catch(() => null)) as ApiProblem | null;

    throw new OnboardingApiError(
      problem?.detail ?? "The onboarding request could not be completed.",
      response.status,
    );
  }

  return (await response.json()) as T;
}

export async function getOnboardingDraft(): Promise<OnboardingDraft | null> {
  try {
    return await request<OnboardingDraft>("");
  } catch (error) {
    if (error instanceof OnboardingApiError && error.status === 404) {
      return null;
    }

    throw error;
  }
}

export function saveProfileStage(displayName: string) {
  return request<OnboardingDraft>("/profile", {
    method: "PUT",
    body: JSON.stringify({ displayName }),
  });
}

export function saveGoalsStage(
  primaryGoal: PrimaryGoal,
  targetAreas: TargetArea[],
) {
  return request<OnboardingDraft>("/goals", {
    method: "PUT",
    body: JSON.stringify({ primaryGoal, targetAreas }),
  });
}

export function saveBodyContextStage(input: {
  experienceLevel: ExperienceLevel | null;
  heightCm: number | null;
  weightKg: number | null;
}) {
  return request<OnboardingDraft>("/body-context", {
    method: "PUT",
    body: JSON.stringify(input),
  });
}

export function completeOnboarding() {
  return request<OnboardingDraft>("/complete", {
    method: "POST",
  });
}
