import type { BodyCheckin, OnboardingDraft } from "@/services";

export type AvatarMeasurementId =
  | "heightCm"
  | "weightKg"
  | "waist"
  | "chest"
  | "hips"
  | "bodyFatPercent"
  | "arm"
  | "thigh";

export type AvatarMeasurementPriority = "minimum" | "recommended" | "optional";

export type AvatarMeasurementDefinition = {
  id: AvatarMeasurementId;
  label: string;
  unit: "cm" | "kg" | "%";
  priority: AvatarMeasurementPriority;
  avatarUse: string;
};

export type AvatarMeasurementReadiness = {
  complete: boolean;
  completedCount: number;
  totalCount: number;
  missingMinimum: readonly AvatarMeasurementDefinition[];
  availableOptional: readonly AvatarMeasurementDefinition[];
  label: string;
  summary: string;
};

export const avatarMeasurementDefinitions = [
  {
    id: "heightCm",
    label: "Height",
    unit: "cm",
    priority: "minimum",
    avatarUse: "sets the vertical scale and posture baseline",
  },
  {
    id: "weightKg",
    label: "Weight",
    unit: "kg",
    priority: "minimum",
    avatarUse: "estimates total body mass when circumference data is light",
  },
  {
    id: "waist",
    label: "Waist",
    unit: "cm",
    priority: "minimum",
    avatarUse: "anchors torso taper and body-composition visual signal",
  },
  {
    id: "chest",
    label: "Chest",
    unit: "cm",
    priority: "recommended",
    avatarUse: "improves upper-torso and chest/back proportion signals",
  },
  {
    id: "hips",
    label: "Hips",
    unit: "cm",
    priority: "recommended",
    avatarUse: "improves pelvis width and lower-body proportion signals",
  },
  {
    id: "bodyFatPercent",
    label: "Body fat",
    unit: "%",
    priority: "optional",
    avatarUse: "helps separate composition changes from scale weight",
  },
  {
    id: "arm",
    label: "Arm",
    unit: "cm",
    priority: "optional",
    avatarUse: "improves arm hypertrophy signal",
  },
  {
    id: "thigh",
    label: "Thigh",
    unit: "cm",
    priority: "optional",
    avatarUse: "improves quad, hamstring, and glute development signal",
  },
] as const satisfies readonly AvatarMeasurementDefinition[];

export const minimumAvatarMeasurements = avatarMeasurementDefinitions.filter(
  (measurement) => measurement.priority === "minimum",
);

export const optionalAvatarMeasurements = avatarMeasurementDefinitions.filter(
  (measurement) => measurement.priority !== "minimum",
);

export function evaluateAvatarMeasurementReadiness({
  profile,
  latestCheckin,
}: {
  profile: OnboardingDraft;
  latestCheckin: BodyCheckin | null;
}): AvatarMeasurementReadiness {
  const missingMinimum = minimumAvatarMeasurements.filter(
    (measurement) => !hasMeasurement(measurement.id, profile, latestCheckin),
  );
  const availableOptional = optionalAvatarMeasurements.filter((measurement) =>
    hasMeasurement(measurement.id, profile, latestCheckin),
  );
  const completedCount =
    minimumAvatarMeasurements.length - missingMinimum.length;
  const complete = missingMinimum.length === 0;

  return {
    complete,
    completedCount,
    totalCount: minimumAvatarMeasurements.length,
    missingMinimum,
    availableOptional,
    label: complete ? "Avatar baseline ready" : "Minimum data needed",
    summary: complete
      ? `Minimum avatar baseline is ready. ${availableOptional.length} optional precision signal${
          availableOptional.length === 1 ? "" : "s"
        } active.`
      : `Add ${missingMinimum.map((measurement) => measurement.label.toLowerCase()).join(", ")} to unlock the minimum avatar baseline.`,
  };
}

function hasMeasurement(
  id: AvatarMeasurementId,
  profile: OnboardingDraft,
  latestCheckin: BodyCheckin | null,
) {
  switch (id) {
    case "heightCm":
      return positiveNumber(profile.heightCm);
    case "weightKg":
      return positiveNumber(
        numberValue(latestCheckin?.weight?.value) ?? profile.weightKg,
      );
    case "waist":
      return positiveNumber(numberValue(latestCheckin?.waist?.value));
    case "chest":
      return positiveNumber(numberValue(latestCheckin?.chest?.value));
    case "hips":
      return positiveNumber(numberValue(latestCheckin?.hips?.value));
    case "bodyFatPercent":
      return positiveNumber(numberValue(latestCheckin?.bodyFatPercent));
    case "arm":
      return positiveNumber(numberValue(latestCheckin?.arm?.value));
    case "thigh":
      return positiveNumber(numberValue(latestCheckin?.thigh?.value));
  }
}

function positiveNumber(value: number | null | undefined) {
  return typeof value === "number" && Number.isFinite(value) && value > 0;
}

function numberValue(value: unknown) {
  if (typeof value === "number") return Number.isFinite(value) ? value : null;
  if (typeof value === "string") {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : null;
  }
  return null;
}
