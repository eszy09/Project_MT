import type { BodyCheckin, OnboardingDraft } from "@/services";
import {
  evaluateAvatarMeasurementReadiness,
  type AvatarMeasurementReadiness,
} from "./measurement-strategy";

export type AvatarSignalSource = "check-in" | "profile" | "empty";

export type AvatarSignals = {
  source: AvatarSignalSource;
  measuredAt: string | null;
  heightCm: number | null;
  weightKg: number | null;
  bodyFatPercent: number | null;
  readiness: AvatarMeasurementReadiness;
  scales: {
    torso: number;
    waist: number;
    hip: number;
    arm: number;
    thigh: number;
  };
  confidenceLabel: string;
  summary: string;
};

const neutralScales = {
  torso: 1,
  waist: 1,
  hip: 1,
  arm: 1,
  thigh: 1,
};

export function buildAvatarSignals({
  profile,
  latestCheckin,
}: {
  profile: OnboardingDraft;
  latestCheckin: BodyCheckin | null;
}): AvatarSignals {
  const derived = latestCheckin?.derivedParameters;
  const readiness = evaluateAvatarMeasurementReadiness({
    profile,
    latestCheckin,
  });
  const source: AvatarSignalSource = latestCheckin
    ? "check-in"
    : profile.heightCm || profile.weightKg
      ? "profile"
      : "empty";

  const heightCm = profile.heightCm ?? null;
  const weightKg =
    numberValue(latestCheckin?.weight?.value) ?? profile.weightKg ?? null;
  const bodyFatPercent = numberValue(latestCheckin?.bodyFatPercent) ?? null;
  const measuredAt = latestCheckin?.measuredAt ?? profile.updatedAt ?? null;

  const scales = derived
    ? {
        torso: clampScale(numberValue(derived.torsoScale) ?? 1),
        waist: clampScale(numberValue(derived.waistScale) ?? 1),
        hip: clampScale(numberValue(derived.hipScale) ?? 1),
        arm: clampScale(numberValue(derived.armScale) ?? 1),
        thigh: clampScale(numberValue(derived.thighScale) ?? 1),
      }
    : estimateFromProfile({ heightCm, weightKg });

  return {
    source,
    measuredAt,
    heightCm,
    weightKg,
    bodyFatPercent,
    readiness,
    scales,
    confidenceLabel:
      source === "check-in"
        ? readiness.complete
          ? "Measurement-driven"
          : "Partial check-in"
        : source === "profile"
          ? "Profile estimate"
          : "Needs measurements",
    summary:
      source === "check-in"
        ? readiness.complete
          ? "Minimum avatar measurements are active, with optional fields improving precision."
          : readiness.summary
        : source === "profile"
          ? "Profile height and weight provide a temporary avatar estimate. Add waist to unlock the minimum avatar baseline."
          : "Add height, weight, and waist to create the first human avatar baseline.",
  };
}

function estimateFromProfile({
  heightCm,
  weightKg,
}: {
  heightCm: number | null;
  weightKg: number | null;
}) {
  if (!heightCm || !weightKg) return neutralScales;

  const heightM = heightCm / 100;
  const bmi = weightKg / (heightM * heightM);
  const massSignal = clamp((bmi - 22) / 18, -0.12, 0.18);

  return {
    torso: clampScale(1 + massSignal * 0.45),
    waist: clampScale(1 + massSignal * 0.75),
    hip: clampScale(1 + massSignal * 0.45),
    arm: clampScale(1 + massSignal * 0.3),
    thigh: clampScale(1 + massSignal * 0.4),
  };
}

function numberValue(value: unknown) {
  if (typeof value === "number") return Number.isFinite(value) ? value : null;
  if (typeof value === "string") {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : null;
  }
  return null;
}

function clampScale(value: number) {
  return clamp(value, 0.82, 1.22);
}

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}
