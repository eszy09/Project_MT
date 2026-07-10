"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireSession } from "@/features/auth";
import {
  ProgressApiError,
  createBodyCheckin,
  type BodyCheckinInput,
} from "@/services";

export type CheckinActionState = {
  error: string | null;
  requestId: string | null;
};

export async function createCheckinAction(
  _previousState: CheckinActionState,
  formData: FormData,
): Promise<CheckinActionState> {
  await requireSession("/check-ins/new");

  const measuredAt = parseMeasuredAt(formData.get("measuredAt"));
  if (!measuredAt) {
    return { error: "Choose a valid check-in date and time.", requestId: null };
  }

  const input: BodyCheckinInput = {
    measuredAt,
    weight: measurement(formData, "weight", "kg"),
    bodyFatPercent: numberValue(formData.get("bodyFatPercent")),
    chest: measurement(formData, "chest", "cm"),
    waist: measurement(formData, "waist", "cm"),
    hips: measurement(formData, "hips", "cm"),
    arm: measurement(formData, "arm", "cm"),
    thigh: measurement(formData, "thigh", "cm"),
    notes: optionalText(formData.get("notes")),
  };

  try {
    await createBodyCheckin(input);
  } catch (error) {
    if (error instanceof ProgressApiError) {
      return { error: error.message, requestId: error.requestId };
    }

    return {
      error: "The check-in could not be saved. Try again.",
      requestId: null,
    };
  }

  revalidatePath("/dashboard");
  revalidatePath("/progress");
  redirect("/progress");
}

function measurement(formData: FormData, key: string, unit: "kg" | "cm") {
  const value = numberValue(formData.get(key));
  return value === undefined ? undefined : { value, unit };
}

function numberValue(value: FormDataEntryValue | null) {
  if (typeof value !== "string" || value.trim() === "") return undefined;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : undefined;
}

function optionalText(value: FormDataEntryValue | null) {
  return typeof value === "string" && value.trim() ? value.trim() : undefined;
}

function parseMeasuredAt(value: FormDataEntryValue | null) {
  if (typeof value !== "string" || !value) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date.toISOString();
}
