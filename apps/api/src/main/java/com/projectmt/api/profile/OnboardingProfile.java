package com.projectmt.api.profile;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.Set;
import java.util.UUID;

public record OnboardingProfile(
  UUID id,
  UUID userId,
  String displayName,
  PrimaryGoal primaryGoal,
  Set<TargetArea> targetAreas,
  ExperienceLevel experienceLevel,
  BigDecimal heightCm,
  BigDecimal weightKg,
  int onboardingStep,
  Instant onboardingCompletedAt,
  Instant createdAt,
  Instant updatedAt
) {
  public OnboardingProfile {
    targetAreas = Set.copyOf(targetAreas);
  }

  public boolean completed() {
    return onboardingCompletedAt != null;
  }
}
