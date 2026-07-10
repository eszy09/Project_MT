import { describe, expect, it } from "vitest";
import type { BodyCheckin, OnboardingDraft } from "@/services";
import {
  evaluateAvatarMeasurementReadiness,
  minimumAvatarMeasurements,
  optionalAvatarMeasurements,
} from "./measurement-strategy";

const profile: OnboardingDraft = {
  id: "profile-id",
  displayName: "Taylor",
  primaryGoal: "BUILD_MUSCLE",
  targetAreas: ["BACK"],
  experienceLevel: "INTERMEDIATE",
  heightCm: 178,
  weightKg: 82,
  onboardingStep: 4,
  completed: true,
  completedAt: "2026-07-10T00:00:00Z",
  updatedAt: "2026-07-10T00:00:00Z",
};

function checkin(overrides: Partial<BodyCheckin> = {}): BodyCheckin {
  return {
    id: "checkin-id",
    userId: "user-id",
    measuredAt: "2026-07-10T00:00:00Z",
    weight: { value: 82, unit: "kg" },
    chest: { value: 103, unit: "cm" },
    waist: { value: 84, unit: "cm" },
    hips: { value: 98, unit: "cm" },
    arm: { value: 36, unit: "cm" },
    thigh: { value: 58, unit: "cm" },
    bodyFatPercent: 18,
    notes: null,
    derivedParameters: null,
    createdAt: "2026-07-10T00:00:00Z",
    ...overrides,
  } as BodyCheckin;
}

describe("avatar measurement strategy", () => {
  it("keeps the required avatar baseline intentionally small", () => {
    expect(
      minimumAvatarMeasurements.map((measurement) => measurement.id),
    ).toEqual(["heightCm", "weightKg", "waist"]);
    expect(
      optionalAvatarMeasurements.map((measurement) => measurement.id),
    ).toEqual(["chest", "hips", "bodyFatPercent", "arm", "thigh"]);
  });

  it("marks the baseline ready when height, weight, and waist exist", () => {
    const readiness = evaluateAvatarMeasurementReadiness({
      profile,
      latestCheckin: checkin(),
    });

    expect(readiness.complete).toBe(true);
    expect(readiness.completedCount).toBe(3);
    expect(readiness.label).toBe("Avatar baseline ready");
  });

  it("explains exactly which minimum measurements are missing", () => {
    const readiness = evaluateAvatarMeasurementReadiness({
      profile: { ...profile, heightCm: null, weightKg: null },
      latestCheckin: null,
    });

    expect(readiness.complete).toBe(false);
    expect(
      readiness.missingMinimum.map((measurement) => measurement.id),
    ).toEqual(["heightCm", "weightKg", "waist"]);
    expect(readiness.summary).toMatch(/height, weight, waist/i);
  });
});
