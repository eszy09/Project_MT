package com.projectmt.api.profile;

import com.projectmt.api.auth.CurrentUserService;
import com.projectmt.api.shared.api.ApiResourceNotFoundException;
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
}
