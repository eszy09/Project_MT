package com.projectmt.api.profile;

import java.time.Instant;
import java.util.UUID;

public record UserProfile(
  UUID id,
  UUID userId,
  String displayName,
  Instant createdAt,
  Instant updatedAt
) {}
