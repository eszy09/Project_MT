package com.projectmt.api.auth;

import java.net.URI;
import java.util.Optional;
import java.util.UUID;
import org.springframework.jdbc.core.simple.JdbcClient;
import org.springframework.stereotype.Repository;

@Repository
public class UserIdentityRepository {

  private final JdbcClient jdbcClient;

  public UserIdentityRepository(JdbcClient jdbcClient) {
    this.jdbcClient = jdbcClient;
  }

  void lock(URI issuer, String subject) {
    jdbcClient
      .sql("""
        SELECT pg_advisory_xact_lock(
          hashtextextended(:identityKey, 0)
        )
        """)
      .param("identityKey", issuer + "\u001f" + subject)
      .query((resultSet, rowNumber) -> Boolean.TRUE)
      .single();
  }

  Optional<UUID> findUserId(URI issuer, String subject) {
    return jdbcClient
      .sql("""
        SELECT user_id
        FROM user_identities
        WHERE issuer = :issuer
          AND subject = :subject
        """)
      .param("issuer", issuer.toString())
      .param("subject", subject)
      .query(UUID.class)
      .optional();
  }

  UUID createUser() {
    return jdbcClient
      .sql("""
        INSERT INTO app_users DEFAULT VALUES
        RETURNING id
        """)
      .query(UUID.class)
      .single();
  }

  void createIdentity(
    UUID userId,
    URI issuer,
    String subject
  ) {
    jdbcClient
      .sql("""
        INSERT INTO user_identities (
          user_id,
          issuer,
          subject
        )
        VALUES (
          :userId,
          :issuer,
          :subject
        )
        """)
      .param("userId", userId)
      .param("issuer", issuer.toString())
      .param("subject", subject)
      .update();
  }
}
