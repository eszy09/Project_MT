package com.projectmt.api.profile;

import com.projectmt.api.shared.api.ApiPaths;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import java.time.Instant;
import java.util.UUID;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping(
  path = ApiPaths.V1 + "/profiles",
  produces = MediaType.APPLICATION_JSON_VALUE
)
public final class UserProfileController {

  private final UserProfileService profiles;

  public UserProfileController(UserProfileService profiles) {
    this.profiles = profiles;
  }

  @GetMapping("/{profileId}")
  @Operation(summary = "Get an owned user profile")
  @ApiResponses({
    @ApiResponse(responseCode = "200", description = "Profile returned."),
    @ApiResponse(
      responseCode = "401",
      ref = "#/components/responses/UnauthenticatedProblem"
    ),
    @ApiResponse(
      responseCode = "404",
      ref = "#/components/responses/ResourceNotFoundProblem"
    )
  })
  public ProfileResponse get(
    @PathVariable UUID profileId
  ) {
    return ProfileResponse.from(profiles.get(profileId));
  }

  @PatchMapping(
    path = "/{profileId}",
    consumes = MediaType.APPLICATION_JSON_VALUE
  )
  @Operation(summary = "Update an owned user profile")
  @ApiResponses({
    @ApiResponse(responseCode = "200", description = "Profile updated."),
    @ApiResponse(
      responseCode = "400",
      ref = "#/components/responses/ValidationProblem"
    ),
    @ApiResponse(
      responseCode = "401",
      ref = "#/components/responses/UnauthenticatedProblem"
    ),
    @ApiResponse(
      responseCode = "404",
      ref = "#/components/responses/ResourceNotFoundProblem"
    )
  })
  public ProfileResponse update(
    @PathVariable UUID profileId,
    @Valid @RequestBody UpdateProfileRequest request
  ) {
    return ProfileResponse.from(
      profiles.updateDisplayName(
        profileId,
        request.displayName()
      )
    );
  }

  @DeleteMapping("/{profileId}")
  @ResponseStatus(HttpStatus.NO_CONTENT)
  @Operation(summary = "Delete an owned user profile")
  @ApiResponses({
    @ApiResponse(responseCode = "204", description = "Profile deleted."),
    @ApiResponse(
      responseCode = "401",
      ref = "#/components/responses/UnauthenticatedProblem"
    ),
    @ApiResponse(
      responseCode = "404",
      ref = "#/components/responses/ResourceNotFoundProblem"
    )
  })
  public void delete(@PathVariable UUID profileId) {
    profiles.delete(profileId);
  }

  public record UpdateProfileRequest(
    @NotBlank
    @Size(max = 100)
    String displayName
  ) {}

  public record ProfileResponse(
    UUID id,
    String displayName,
    Instant createdAt,
    Instant updatedAt
  ) {
    static ProfileResponse from(UserProfile profile) {
      return new ProfileResponse(
        profile.id(),
        profile.displayName(),
        profile.createdAt(),
        profile.updatedAt()
      );
    }
  }
}
