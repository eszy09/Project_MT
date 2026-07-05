"use server";

import { redirect } from "next/navigation";
import { requireSession } from "@/features/auth";
import {
  completeOnboarding,
  saveBodyContextStage,
  saveGoalsStage,
  saveProfileStage,
} from "@/services";
import type { ExperienceLevel, PrimaryGoal, TargetArea } from "@/services";

export type OnboardingActionState = {
  error: string | null;
};

const goals = new Set<PrimaryGoal>([
  "BUILD_MUSCLE",
  "LOSE_FAT",
  "IMPROVE_STRENGTH",
  "GENERAL_FITNESS",
]);

const targetAreas = new Set<TargetArea>([
  "CHEST",
  "BACK",
  "SHOULDERS",
  "ARMS",
  "CORE",
  "GLUTES",
  "LEGS",
  "FULL_BODY",
]);

const experienceLevels = new Set<ExperienceLevel>([
  "BEGINNER",
  "INTERMEDIATE",
  "ADVANCED",
]);

export async function saveProfileAction(
  _state: OnboardingActionState,
  formData: FormData,
): Promise<OnboardingActionState> {
  await requireSession("/onboarding?step=1");
  const displayName = String(formData.get("displayName") ?? "").trim();

  if (!displayName || displayName.length > 100) {
    return { error: "Enter a display name between 1 and 100 characters." };
  }

  try {
    await saveProfileStage(displayName);
  } catch (error) {
    return { error: errorMessage(error) };
  }

  redirect("/onboarding?step=2");
}

export async function saveGoalsAction(
  _state: OnboardingActionState,
  formData: FormData,
): Promise<OnboardingActionState> {
  await requireSession("/onboarding?step=2");
  const primaryGoal = String(formData.get("primaryGoal") ?? "");
  const selectedAreas = formData
    .getAll("targetAreas")
    .map(String)
    .filter((area): area is TargetArea => targetAreas.has(area as TargetArea));

  if (!goals.has(primaryGoal as PrimaryGoal)) {
    return { error: "Choose one primary goal." };
  }

  if (selectedAreas.length === 0) {
    return { error: "Choose at least one target area." };
  }

  try {
    await saveGoalsStage(primaryGoal as PrimaryGoal, selectedAreas);
  } catch (error) {
    return { error: errorMessage(error) };
  }

  redirect("/onboarding?step=3");
}

export async function saveBodyContextAction(
  _state: OnboardingActionState,
  formData: FormData,
): Promise<OnboardingActionState> {
  await requireSession("/onboarding?step=3");
  const rawExperienceLevel = String(formData.get("experienceLevel") ?? "");
  const experienceLevel = experienceLevels.has(
    rawExperienceLevel as ExperienceLevel,
  )
    ? (rawExperienceLevel as ExperienceLevel)
    : null;
  const heightCm = optionalNumber(formData.get("heightCm"));
  const weightKg = optionalNumber(formData.get("weightKg"));

  if (heightCm !== null && (heightCm < 50 || heightCm > 300)) {
    return { error: "Height must be between 50 and 300 cm." };
  }

  if (weightKg !== null && (weightKg < 20 || weightKg > 500)) {
    return { error: "Weight must be between 20 and 500 kg." };
  }

  try {
    await saveBodyContextStage({ experienceLevel, heightCm, weightKg });
  } catch (error) {
    return { error: errorMessage(error) };
  }

  redirect("/onboarding?step=4");
}

export async function completeOnboardingAction(
  _state: OnboardingActionState,
  _formData: FormData,
): Promise<OnboardingActionState> {
  void _state;
  void _formData;
  await requireSession("/onboarding?step=4");

  try {
    await completeOnboarding();
  } catch (error) {
    return { error: errorMessage(error) };
  }

  redirect("/dashboard");
}

function optionalNumber(value: FormDataEntryValue | null) {
  const text = String(value ?? "").trim();

  if (!text) {
    return null;
  }

  const number = Number(text);
  return Number.isFinite(number) ? number : null;
}

function errorMessage(error: unknown) {
  return error instanceof Error
    ? error.message
    : "We could not save this stage. Try again.";
}
