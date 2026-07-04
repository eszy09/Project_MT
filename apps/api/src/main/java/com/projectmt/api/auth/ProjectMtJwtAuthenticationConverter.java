package com.projectmt.api.auth;

import org.springframework.core.convert.converter.Converter;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.security.oauth2.server.resource.authentication.JwtGrantedAuthoritiesConverter;
import org.springframework.stereotype.Component;

@Component
public final class ProjectMtJwtAuthenticationConverter
  implements Converter<Jwt, ProjectMtAuthenticationToken> {

  private final OidcUserService users;
  private final JwtGrantedAuthoritiesConverter authoritiesConverter =
    new JwtGrantedAuthoritiesConverter();

  ProjectMtJwtAuthenticationConverter(OidcUserService users) {
    this.users = users;
  }

  @Override
  public ProjectMtAuthenticationToken convert(Jwt jwt) {
    return new ProjectMtAuthenticationToken(
      jwt,
      authoritiesConverter.convert(jwt),
      users.resolve(jwt)
    );
  }
}
