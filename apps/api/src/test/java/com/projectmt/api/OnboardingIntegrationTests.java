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
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.context.SpringBootTest.WebEnvironment;
import org.springframework.boot.test.web.server.LocalServerPort;
import org.springframework.context.annotation.Import;
import org.springframework.http.MediaType;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.beans.factory.annotation.Autowired;

@SpringBootTest(webEnvironment = WebEnvironment.RANDOM_PORT)
@Import({
  PostgresTestConfiguration.class,
  TestSecurityConfiguration.class
})
class OnboardingIntegrationTests {

  private static final HttpClient HTTP_CLIENT =
    HttpClient.newHttpClient();

  @LocalServerPort
  private int port;

  @Autowired
  private JdbcTemplate jdbcTemplate;

  @Test
  void onboardingDraftPersistsAcrossStagesAndCompletes()
    throws Exception {
    String token = uniqueToken("onboarding-owner");

    assertEquals(404, getDraft(token).statusCode());

    var profileResponse = put(
      token,
      "/profile",
      """
      {"displayName":"Taylor"}
      """
    );
    assertEquals(200, profileResponse.statusCode());
    assertTrue(profileResponse.body().contains("\"onboardingStep\":2"));

    var goalsResponse = put(
      token,
      "/goals",
      """
      {
        "primaryGoal":"BUILD_MUSCLE",
        "targetAreas":["BACK","LEGS"]
      }
      """
    );
    assertEquals(200, goalsResponse.statusCode());
    assertTrue(goalsResponse.body().contains("\"onboardingStep\":3"));

    var bodyResponse = put(
      token,
      "/body-context",
      """
      {
        "experienceLevel":"INTERMEDIATE",
        "heightCm":178.5,
        "weightKg":79.25
      }
      """
    );
    assertEquals(200, bodyResponse.statusCode());
    assertTrue(bodyResponse.body().contains("\"onboardingStep\":4"));

    var persistedDraft = getDraft(token);
    assertEquals(200, persistedDraft.statusCode());
    assertTrue(
      persistedDraft.body().contains("\"primaryGoal\":\"BUILD_MUSCLE\"")
    );
    assertTrue(persistedDraft.body().contains("\"BACK\""));
    assertTrue(persistedDraft.body().contains("\"LEGS\""));

    var completed = post(token, "/complete");
    assertEquals(200, completed.statusCode());
    assertTrue(completed.body().contains("\"completed\":true"));

    Integer completedCount = jdbcTemplate.queryForObject(
      """
      SELECT COUNT(*)
      FROM user_profiles
      WHERE display_name = 'Taylor'
        AND onboarding_completed_at IS NOT NULL
      """,
      Integer.class
    );
    assertEquals(1, completedCount);
  }

  @Test
  void returningToAnEarlierStageDoesNotLoseAcceptedGoals()
    throws Exception {
    String token = uniqueToken("safe-back");

    put(token, "/profile", "{\"displayName\":\"First name\"}");
    put(
      token,
      "/goals",
      """
      {
        "primaryGoal":"IMPROVE_STRENGTH",
        "targetAreas":["FULL_BODY"]
      }
      """
    );

    var updatedProfile = put(
      token,
      "/profile",
      "{\"displayName\":\"Updated name\"}"
    );

    assertEquals(200, updatedProfile.statusCode());
    assertTrue(
      updatedProfile.body().contains(
        "\"primaryGoal\":\"IMPROVE_STRENGTH\""
      )
    );
    assertTrue(updatedProfile.body().contains("\"FULL_BODY\""));
    assertTrue(updatedProfile.body().contains("\"onboardingStep\":3"));
  }

  @Test
  void oneUserCannotReadAnotherUsersOnboardingDraft()
    throws Exception {
    String ownerToken = uniqueToken("draft-owner");
    put(ownerToken, "/profile", "{\"displayName\":\"Private\"}");

    var attackerResponse = getDraft(
      uniqueToken("draft-attacker")
    );

    assertEquals(404, attackerResponse.statusCode());
    assertTrue(
      attackerResponse.body().contains(
        "\"code\":\"RESOURCE_NOT_FOUND\""
      )
    );
  }

  @Test
  void incompleteOnboardingCannotBeCompleted()
    throws Exception {
    String token = uniqueToken("incomplete");
    put(token, "/profile", "{\"displayName\":\"Not finished\"}");

    var response = post(token, "/complete");

    assertEquals(409, response.statusCode());
    assertTrue(response.body().contains("\"code\":\"CONFLICT\""));
  }

  private HttpResponse<String> getDraft(String token)
    throws Exception {
    return send(
      HttpRequest
        .newBuilder(onboardingUri(""))
        .header("Authorization", "Bearer " + token)
        .GET()
        .build()
    );
  }

  private HttpResponse<String> put(
    String token,
    String path,
    String body
  ) throws Exception {
    return send(
      HttpRequest
        .newBuilder(onboardingUri(path))
        .header("Authorization", "Bearer " + token)
        .header("Content-Type", MediaType.APPLICATION_JSON_VALUE)
        .PUT(HttpRequest.BodyPublishers.ofString(body))
        .build()
    );
  }

  private HttpResponse<String> post(
    String token,
    String path
  ) throws Exception {
    return send(
      HttpRequest
        .newBuilder(onboardingUri(path))
        .header("Authorization", "Bearer " + token)
        .POST(HttpRequest.BodyPublishers.noBody())
        .build()
    );
  }

  private HttpResponse<String> send(HttpRequest request)
    throws Exception {
    return HTTP_CLIENT.send(
      request,
      HttpResponse.BodyHandlers.ofString()
    );
  }

  private URI onboardingUri(String path) {
    return URI.create(
      "http://localhost:"
        + port
        + "/api/v1/profile/onboarding"
        + path
    );
  }

  private String uniqueToken(String prefix) {
    return prefix + "-" + UUID.randomUUID();
  }
}
