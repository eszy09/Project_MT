package com.projectmt.api.support;

import java.time.Instant;
import java.util.List;
import org.springframework.boot.test.context.TestConfiguration;
import org.springframework.context.annotation.Bean;
import org.springframework.security.oauth2.core.OAuth2Error;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.security.oauth2.jwt.JwtDecoder;
import org.springframework.security.oauth2.jwt.JwtValidationException;

@TestConfiguration(proxyBeanMethods = false)
public class TestSecurityConfiguration {

  public static final String ISSUER =
    "https://project-mt-tests.example/";
  public static final String AUDIENCE =
    "https://api.project-mt";

  @Bean
  JwtDecoder jwtDecoder() {
    return token -> {
      if ("expired-test-token".equals(token)) {
        throw new JwtValidationException(
          "The access token has expired.",
          List.of(
            new OAuth2Error(
              "invalid_token",
              "The access token has expired.",
              null
            )
          )
        );
      }

      Instant now = Instant.now();

      return Jwt
        .withTokenValue(token)
        .header("alg", "RS256")
        .issuer(ISSUER)
        .subject(token)
        .audience(List.of(AUDIENCE))
        .issuedAt(now.minusSeconds(30))
        .expiresAt(now.plusSeconds(300))
        .claim("scope", "fitness:read")
        .build();
    };
  }
}
