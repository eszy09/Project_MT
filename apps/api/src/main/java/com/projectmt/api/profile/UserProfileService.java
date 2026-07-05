package com.projectmt.api.profile;

import com.projectmt.api.auth.CurrentUserService;
import com.projectmt.api.shared.api.ApiConflictException;
import com.projectmt.api.shared.api.ApiResourceNotFoundException;
import java.math.BigDecimal;
import java.util.Set;
import java.util.UUID;
import org.springframework.stereotype.Service;

@Service
public final class UserProfileService {

  private final CurrentUserService currentUsers;
  private final UserProfileRepository profiles;

  public UserProfileService(
    CurrentUserService currentUsers,
    UserProfileRepository profiles
  ) {
    this.currentUsers = currentUsers;
    this.profiles = profiles;
  }

  public UserProfile get(UUID profileId) {
    UUID userId = currentUsers.requireCurrentUser().id();

    return profiles
      .findByIdForUser(profileId, userId)
      .orElseThrow(ApiResourceNotFoundException::new);
  }

  public UserProfile updateDisplayName(
    UUID profileId,
    String displayName
  ) {
    UUID userId = currentUsers.requireCurrentUser().id();

    return profiles
      .updateDisplayNameForUser(
        profileId,
        userId,
        displayName.strip()
      )
      .orElseThrow(ApiResourceNotFoundException::new);
  }

  public void delete(UUID profileId) {
    UUID userId = currentUsers.requireCurrentUser().id();

    if (!profiles.deleteByIdForUser(profileId, userId)) {
      throw new ApiResourceNotFoundException();
    }
  }

  public OnboardingProfile getOnboarding() {
    UUID userId = currentUsers.requireCurrentUser().id();

    return profiles
      .findOnboardingForUser(userId)
      .orElseThrow(ApiResourceNotFoundException::new);
  }

  public OnboardingProfile saveProfileStage(String displayName) {
    UUID userId = currentUsers.requireCurrentUser().id();

    return profiles.saveProfileStageForUser(
      userId,
      displayName.strip()
    );
  }

  public OnboardingProfile saveGoalsStage(
    PrimaryGoal primaryGoal,
    Set<TargetArea> targetAreas
  ) {
    UUID userId = currentUsers.requireCurrentUser().id();

    return profiles
      .saveGoalsStageForUser(userId, primaryGoal, targetAreas)
      .orElseThrow(ApiResourceNotFoundException::new);
  }

  public OnboardingProfile saveBodyContextStage(
    ExperienceLevel experienceLevel,
    BigDecimal heightCm,
    BigDecimal weightKg
  ) {
    UUID userId = currentUsers.requireCurrentUser().id();

    return profiles
      .saveBodyContextStageForUser(
        userId,
        experienceLevel,
        heightCm,
        weightKg
      )
      .orElseThrow(ApiResourceNotFoundException::new);
  }

  public OnboardingProfile completeOnboarding() {
    UUID userId = currentUsers.requireCurrentUser().id();

    return profiles
      .completeOnboardingForUser(userId)
      .orElseThrow(() -> new ApiConflictException(
        "Complete the required profile and goals before finishing onboarding."
      ));
  }
}
