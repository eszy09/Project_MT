package com.projectmt.api;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;

import com.projectmt.api.support.PostgresTestConfiguration;
import java.util.Arrays;
import java.util.Map;
import java.util.UUID;
import org.flywaydb.core.Flyway;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.context.annotation.Import;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.jdbc.core.JdbcTemplate;

@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.NONE)
@Import(PostgresTestConfiguration.class)
class DatabaseMigrationTests {

  @Autowired
  private Flyway flyway;

  @Autowired
  private JdbcTemplate jdbcTemplate;

  @Test
  void flywayMigratesAnEmptyPostgresDatabase() {
    boolean versionTwoApplied = Arrays
      .stream(flyway.info().applied())
      .anyMatch(migration ->
        migration.getVersion() != null
          && "2".equals(migration.getVersion().getVersion())
      );

    assertTrue(versionTwoApplied);

    Integer tableCount = jdbcTemplate.queryForObject(
      """
      SELECT COUNT(*)
      FROM information_schema.tables
      WHERE table_schema = 'public'
        AND table_name IN (
          'app_users',
          'user_identities',
          'user_profiles'
        )
      """,
      Integer.class
    );

    assertEquals(3, tableCount);
  }

  @Test
  void usersReceiveIdentifiersAndTimestamps() {
    UUID userId = jdbcTemplate.queryForObject(
      "INSERT INTO app_users DEFAULT VALUES RETURNING id",
      UUID.class
    );

    assertNotNull(userId);

    Map<String, Object> timestamps = jdbcTemplate.queryForMap(
      """
      SELECT created_at, updated_at
      FROM app_users
      WHERE id = ?
      """,
      userId
    );

    assertNotNull(timestamps.get("created_at"));
    assertNotNull(timestamps.get("updated_at"));
  }

  @Test
  void identityIssuerAndSubjectMustBeUnique() {
    UUID userId = createUser();
    String issuer = "https://identity.example.test";
    String subject = "subject-" + UUID.randomUUID();

    jdbcTemplate.update(
      """
      INSERT INTO user_identities (user_id, issuer, subject)
      VALUES (?, ?, ?)
      """,
      userId,
      issuer,
      subject
    );

    assertThrows(
      DataIntegrityViolationException.class,
      () -> jdbcTemplate.update(
        """
        INSERT INTO user_identities (user_id, issuer, subject)
        VALUES (?, ?, ?)
        """,
        createUser(),
        issuer,
        subject
      )
    );
  }

  @Test
  void identityRequiresAnExistingUser() {
    assertThrows(
      DataIntegrityViolationException.class,
      () -> jdbcTemplate.update(
        """
        INSERT INTO user_identities (user_id, issuer, subject)
        VALUES (?, ?, ?)
        """,
        UUID.randomUUID(),
        "https://identity.example.test",
        "subject-" + UUID.randomUUID()
      )
    );
  }

  @Test
  void profileRequiresAnExistingUser() {
    assertThrows(
      DataIntegrityViolationException.class,
      () -> jdbcTemplate.update(
        """
        INSERT INTO user_profiles (user_id, display_name)
        VALUES (?, ?)
        """,
        UUID.randomUUID(),
        "Unknown user"
      )
    );
  }

  @Test
  void userCanHaveOnlyOneProfile() {
    UUID userId = createUser();

    jdbcTemplate.update(
      """
      INSERT INTO user_profiles (user_id, display_name)
      VALUES (?, ?)
      """,
      userId,
      "First profile"
    );

    assertThrows(
      DataIntegrityViolationException.class,
      () -> jdbcTemplate.update(
        """
        INSERT INTO user_profiles (user_id, display_name)
        VALUES (?, ?)
        """,
        userId,
        "Second profile"
      )
    );
  }

  private UUID createUser() {
    return jdbcTemplate.queryForObject(
      "INSERT INTO app_users DEFAULT VALUES RETURNING id",
      UUID.class
    );
  }
}
