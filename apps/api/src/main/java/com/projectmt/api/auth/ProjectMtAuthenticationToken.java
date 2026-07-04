package com.projectmt.api.auth;

import java.util.Collection;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.security.oauth2.server.resource.authentication.JwtAuthenticationToken;

public final class ProjectMtAuthenticationToken
  extends JwtAuthenticationToken {

  private final AuthenticatedUser user;

  ProjectMtAuthenticationToken(
    Jwt jwt,
    Collection<? extends GrantedAuthority> authorities,
    AuthenticatedUser user
  ) {
    super(jwt, authorities, user.id().toString());
    this.user = user;
  }

  public AuthenticatedUser user() {
    return user;
  }
}
