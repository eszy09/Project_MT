package com.projectmt.api.auth;

import java.net.URI;
import java.util.UUID;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class OidcUserService {

  private final UserIdentityRepository identities;

  OidcUserService(UserIdentityRepository identities) {
    this.identities = identities;
  }

  @Transactional
  public AuthenticatedUser resolve(Jwt jwt) {
    var tokenIssuer = jwt.getIssuer();
    String subject = jwt.getSubject();

    if (tokenIssuer == null) {
      throw new IllegalArgumentException(
        "The authenticated token does not contain an issuer."
      );
    }
    if (subject == null || subject.isBlank()) {
      throw new IllegalArgumentException(
        "The authenticated token does not contain a subject."
      );
    }

    URI issuer = URI.create(tokenIssuer.toString());

    identities.lock(issuer, subject);

    UUID userId = identities
      .findUserId(issuer, subject)
      .orElseGet(() -> createIdentity(issuer, subject));

    return new AuthenticatedUser(userId, issuer, subject);
  }

  private UUID createIdentity(URI issuer, String subject) {
    UUID userId = identities.createUser();
    identities.createIdentity(userId, issuer, subject);
    return userId;
  }
}
