package com.projectmt.api.profile;

import com.projectmt.api.shared.api.ApiPaths;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import jakarta.validation.Valid;
import jakarta.validation.constraints.DecimalMax;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import java.math.BigDecimal;
import java.time.Instant;
import java.util.Set;
import java.util.UUID;
import org.springframework.http.MediaType;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping(
  path = ApiPaths.V1 + "/profile/onboarding",
  produces = MediaType.APPLICATION_JSON_VALUE
)
public final class OnboardingController {

  private final UserProfileService profiles;

  public OnboardingController(UserProfileService profiles) {
    this.profiles = profiles;
  }

  @GetMapping
  @Operation(summary = "Get the current user's onboarding draft")
  @ApiResponses({
    @ApiResponse(responseCode = "200", description = "Draft returned."),
    @ApiResponse(
      responseCode = "401",
      ref = "#/components/responses/UnauthenticatedProblem"
    ),
    @ApiResponse(
      responseCode = "404",
      ref = "#/components/responses/ResourceNotFoundProblem"
    )
  })
  public OnboardingResponse get() {
    return OnboardingResponse.from(profiles.getOnboarding());
  }

  @PutMapping(
    path = "/profile",
    consumes = MediaType.APPLICATION_JSON_VALUE
  )
  @Operation(summary = "Save the profile onboarding stage")
  public OnboardingResponse saveProfile(
    @Valid @RequestBody ProfileStageRequest request
  ) {
    return OnboardingResponse.from(
      profiles.saveProfileStage(request.displayName())
    );
  }

  @PutMapping(
    path = "/goals",
    consumes = MediaType.APPLICATION_JSON_VALUE
  )
  @Operation(summary = "Save the goals onboarding stage")
  public OnboardingResponse saveGoals(
    @Valid @RequestBody GoalsStageRequest request
  ) {
    return OnboardingResponse.from(
      profiles.saveGoalsStage(
        request.primaryGoal(),
        request.targetAreas()
      )
    );
  }

  @PutMapping(
    path = "/body-context",
    consumes = MediaType.APPLICATION_JSON_VALUE
  )
  @Operation(summary = "Save optional body context")
  public OnboardingResponse saveBodyContext(
    @Valid @RequestBody BodyContextStageRequest request
  ) {
    return OnboardingResponse.from(
      profiles.saveBodyContextStage(
        request.experienceLevel(),
        request.heightCm(),
        request.weightKg()
      )
    );
  }

  @PostMapping("/complete")
  @Operation(summary = "Complete the current user's onboarding")
  @ApiResponses({
    @ApiResponse(responseCode = "200", description = "Onboarding completed."),
    @ApiResponse(
      responseCode = "401",
      ref = "#/components/responses/UnauthenticatedProblem"
    ),
    @ApiResponse(
      responseCode = "409",
      ref = "#/components/responses/ConflictProblem"
    )
  })
  public OnboardingResponse complete() {
    return OnboardingResponse.from(
      profiles.completeOnboarding()
    );
  }

  public record ProfileStageRequest(
    @NotBlank
    @Size(max = 100)
    String displayName
  ) {}

  public record GoalsStageRequest(
    @NotNull
    PrimaryGoal primaryGoal,

    @NotEmpty
    Set<@NotNull TargetArea> targetAreas
  ) {}

  public record BodyContextStageRequest(
    ExperienceLevel experienceLevel,

    @DecimalMin("50.00")
    @DecimalMax("300.00")
    BigDecimal heightCm,

    @DecimalMin("20.00")
    @DecimalMax("500.00")
    BigDecimal weightKg
  ) {}

  public record OnboardingResponse(
    UUID id,
    String displayName,
    PrimaryGoal primaryGoal,
    Set<TargetArea> targetAreas,
    ExperienceLevel experienceLevel,
    BigDecimal heightCm,
    BigDecimal weightKg,
    int onboardingStep,
    boolean completed,
    Instant completedAt,
    Instant updatedAt
  ) {
    static OnboardingResponse from(OnboardingProfile profile) {
      return new OnboardingResponse(
        profile.id(),
        profile.displayName(),
        profile.primaryGoal(),
        profile.targetAreas(),
        profile.experienceLevel(),
        profile.heightCm(),
        profile.weightKg(),
        profile.onboardingStep(),
        profile.completed(),
        profile.onboardingCompletedAt(),
        profile.updatedAt()
      );
    }
  }
}
