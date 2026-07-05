package com.projectmt.api;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;

import com.projectmt.api.support.PostgresTestConfiguration;
import com.projectmt.api.support.TestSecurityConfiguration;
import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.util.UUID;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.context.SpringBootTest.WebEnvironment;
import org.springframework.boot.test.web.server.LocalServerPort;
import org.springframework.context.annotation.Import;
import org.springframework.http.MediaType;
import org.springframework.jdbc.core.JdbcTemplate;

@SpringBootTest(webEnvironment = WebEnvironment.RANDOM_PORT)
@Import({
  PostgresTestConfiguration.class,
  TestSecurityConfiguration.class
})
class UserOwnershipIntegrationTests {

  private static final HttpClient HTTP_CLIENT =
    HttpClient.newHttpClient();

  @LocalServerPort
  private int port;

  @Autowired
  private JdbcTemplate jdbcTemplate;

  @Test
  void anotherUserCannotReadProfileByResourceId()
    throws Exception {
    UUID profileId = createProfile(
      uniqueToken("read-owner"),
      "Profile owner"
    );

    var attackerResponse = getProfile(
      profileId,
      uniqueToken("read-attacker")
    );

    assertResourceNotFound(attackerResponse);
  }

  @Test
  void anotherUserCannotUpdateProfileByResourceId()
    throws Exception {
    String ownerToken = uniqueToken("update-owner");
    UUID profileId = createProfile(
      ownerToken,
      "Original name"
    );

    var attackerResponse = updateProfile(
      profileId,
      uniqueToken("update-attacker"),
      "Changed by attacker"
    );

    assertResourceNotFound(attackerResponse);
    assertEquals("Original name", displayName(profileId));

    var ownerResponse = updateProfile(
      profileId,
      ownerToken,
      "Updated by owner"
    );

    assertEquals(200, ownerResponse.statusCode());
    assertTrue(
      ownerResponse.body().contains(
        "\"displayName\":\"Updated by owner\""
      )
    );
  }

  @Test
  void anotherUserCannotDeleteProfileByResourceId()
    throws Exception {
    String ownerToken = uniqueToken("delete-owner");
    UUID profileId = createProfile(
      ownerToken,
      "Profile to retain"
    );

    var attackerResponse = deleteProfile(
      profileId,
      uniqueToken("delete-attacker")
    );

    assertResourceNotFound(attackerResponse);
    assertEquals(1, profileCount(profileId));

    var ownerResponse = deleteProfile(profileId, ownerToken);

    assertEquals(204, ownerResponse.statusCode());
    assertEquals(0, profileCount(profileId));
  }

  @Test
  void missingAndCrossUserProfilesUseSameErrorContract()
    throws Exception {
    String attackerToken = uniqueToken("indistinguishable");
    UUID ownerProfileId = createProfile(
      uniqueToken("different-owner"),
      "Private profile"
    );

    var crossUserResponse = getProfile(
      ownerProfileId,
      attackerToken
    );
    var missingResponse = getProfile(
      UUID.randomUUID(),
      attackerToken
    );

    assertResourceNotFound(crossUserResponse);
    assertResourceNotFound(missingResponse);
  }

  private UUID createProfile(
    String ownerToken,
    String displayName
  ) throws Exception {
    ensureUserExists(ownerToken);

    UUID userId = jdbcTemplate.queryForObject(
      """
      SELECT user_id
      FROM user_identities
      WHERE subject = ?
      """,
      UUID.class,
      ownerToken
    );

    return jdbcTemplate.queryForObject(
      """
      INSERT INTO user_profiles (user_id, display_name)
      VALUES (?, ?)
      RETURNING id
      """,
      UUID.class,
      userId,
      displayName
    );
  }

  private void ensureUserExists(String token) throws Exception {
    var response = getProfile(UUID.randomUUID(), token);
    assertResourceNotFound(response);
  }

  private HttpResponse<String> getProfile(
    UUID profileId,
    String token
  ) throws Exception {
    return send(
      HttpRequest
        .newBuilder(profileUri(profileId))
        .header("Authorization", "Bearer " + token)
        .header("X-Request-ID", "ownership-test")
        .GET()
        .build()
    );
  }

  private HttpResponse<String> updateProfile(
    UUID profileId,
    String token,
    String displayName
  ) throws Exception {
    String requestBody =
      "{\"displayName\":\"" + displayName + "\"}";

    return send(
      HttpRequest
        .newBuilder(profileUri(profileId))
        .header("Authorization", "Bearer " + token)
        .header("Content-Type", MediaType.APPLICATION_JSON_VALUE)
        .header("X-Request-ID", "ownership-test")
        .method(
          "PATCH",
          HttpRequest.BodyPublishers.ofString(requestBody)
        )
        .build()
    );
  }

  private HttpResponse<String> deleteProfile(
    UUID profileId,
    String token
  ) throws Exception {
    return send(
      HttpRequest
        .newBuilder(profileUri(profileId))
        .header("Authorization", "Bearer " + token)
        .header("X-Request-ID", "ownership-test")
        .DELETE()
        .build()
    );
  }

  private void assertResourceNotFound(
    HttpResponse<String> response
  ) {
    assertEquals(404, response.statusCode());
    assertEquals(
      "ownership-test",
      response
        .headers()
        .firstValue("X-Request-ID")
        .orElseThrow()
    );
    assertTrue(
      response.body().contains(
        "\"code\":\"RESOURCE_NOT_FOUND\""
      )
    );
    assertTrue(
      response.body().contains(
        "\"detail\":\"The requested resource was not found.\""
      )
    );
  }

  private String displayName(UUID profileId) {
    return jdbcTemplate.queryForObject(
      """
      SELECT display_name
      FROM user_profiles
      WHERE id = ?
      """,
      String.class,
      profileId
    );
  }

  private int profileCount(UUID profileId) {
    return jdbcTemplate.queryForObject(
      """
      SELECT COUNT(*)
      FROM user_profiles
      WHERE id = ?
      """,
      Integer.class,
      profileId
    );
  }

  private HttpResponse<String> send(HttpRequest request)
    throws Exception {
    return HTTP_CLIENT.send(
      request,
      HttpResponse.BodyHandlers.ofString()
    );
  }

  private URI profileUri(UUID profileId) {
    return URI.create(
      "http://localhost:"
        + port
        + "/api/v1/profiles/"
        + profileId
    );
  }

  private String uniqueToken(String prefix) {
    return prefix + "-" + UUID.randomUUID();
  }
}
