package com.projectmt.api.auth;

import java.net.URI;
import java.util.Objects;
import java.util.UUID;

public record AuthenticatedUser(
  UUID id,
  URI issuer,
  String subject
) {
  public AuthenticatedUser {
    Objects.requireNonNull(id, "id must not be null");
    Objects.requireNonNull(issuer, "issuer must not be null");
    if (subject == null || subject.isBlank()) {
      throw new IllegalArgumentException("subject must not be blank");
    }
  }
}
