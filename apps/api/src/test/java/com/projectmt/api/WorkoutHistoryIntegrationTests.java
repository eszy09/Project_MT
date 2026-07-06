package com.projectmt.api;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.projectmt.api.support.PostgresTestConfiguration;
import com.projectmt.api.support.TestSecurityConfiguration;
import java.net.URI;
import java.net.URLEncoder;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.nio.charset.StandardCharsets;
import java.util.UUID;
import org.junit.jupiter.api.Test;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.context.SpringBootTest.WebEnvironment;
import org.springframework.boot.test.web.server.LocalServerPort;
import org.springframework.context.annotation.Import;

@SpringBootTest(webEnvironment = WebEnvironment.RANDOM_PORT)
@Import({
  PostgresTestConfiguration.class,
  TestSecurityConfiguration.class
})
class WorkoutHistoryIntegrationTests {

  private static final HttpClient HTTP_CLIENT =
    HttpClient.newHttpClient();

  @LocalServerPort
  private int port;

  private final ObjectMapper objectMapper = new ObjectMapper();

  @Test
  void historyUsesStableCursorPaginationAndExerciseFilters()
    throws Exception {
    String token = uniqueValue("history-owner");
    save(token, "2026-07-01T10:00:00Z", "80");
    save(token, "2026-07-02T10:00:00Z", "85");
    save(token, "2026-07-03T10:00:00Z", "90");

    JsonNode first = json(get(token, "?limit=2").body());
    assertEquals(2, first.path("items").size());
    assertEquals(
      "2026-07-03T11:00:00Z",
      first.path("items").get(0).path("completedAt").asText()
    );
    assertFalse(first.path("nextCursor").isNull());

    String cursor = URLEncoder.encode(
      first.path("nextCursor").asText(),
      StandardCharsets.UTF_8
    );
    JsonNode second = json(
      get(token, "?limit=2&cursor=" + cursor).body()
    );
    assertEquals(1, second.path("items").size());
    assertTrue(second.path("nextCursor").isNull());

    JsonNode filtered = json(
      get(token, "?exerciseCode=back-squat").body()
    );
    assertEquals(3, filtered.path("items").size());

    JsonNode empty = json(
      get(token, "?exerciseCode=overhead-press").body()
    );
    assertEquals(0, empty.path("items").size());
  }

  @Test
  void detailReconstructsOrderAndEnforcesOwnership()
    throws Exception {
    String owner = uniqueValue("detail-owner");
    JsonNode saved = json(save(owner, "2026-07-04T10:00:00Z", "100").body());
    String workoutId = saved.path("id").asText();

    var detail = get(owner, "/" + workoutId);
    assertEquals(200, detail.statusCode());
    JsonNode body = json(detail.body());
    assertEquals("barbell-bench-press", body
      .path("exercises").get(0).path("exerciseCode").asText());
    assertEquals(1, body
      .path("exercises").get(0).path("sets").get(0).path("position").asInt());
    assertEquals(2, body.path("exercises").size());

    var attacker = get(uniqueValue("attacker"), "/" + workoutId);
    assertEquals(404, attacker.statusCode());
  }

  @Test
  void previousPerformanceUsesLatestRelevantCompletedSession()
    throws Exception {
    String owner = uniqueValue("previous-owner");
    save(owner, "2026-07-01T10:00:00Z", "80");
    save(owner, "2026-07-05T10:00:00Z", "95");

    var response = get(owner, "/previous/barbell-bench-press");
    assertEquals(200, response.statusCode());
    JsonNode body = json(response.body());
    assertEquals("2026-07-05T11:00:00Z", body.path("completedAt").asText());
    assertEquals(1, body.path("sets").size());
    assertEquals("95.0", body.path("sets").get(0).path("weightKg").asText());

    assertEquals(
      404,
      get(owner, "/previous/overhead-press").statusCode()
    );
  }

  @Test
  void malformedCursorAndInvertedDatesAreRejected()
    throws Exception {
    String token = uniqueValue("invalid-filter-owner");

    assertEquals(400, get(token, "?cursor=invalid").statusCode());
    assertEquals(
      400,
      get(
        token,
        "?from=2026-07-05T00:00:00Z&to=2026-07-01T00:00:00Z"
      ).statusCode()
    );
  }

  private HttpResponse<String> save(
    String token,
    String startedAt,
    String benchWeight
  ) throws Exception {
    String completedAt = startedAt.replace("T10:", "T11:");
    String body = """
      {
        "startedAt":"%s",
        "completedAt":"%s",
        "exercises":[
          {
            "exerciseCode":"barbell-bench-press",
            "displayName":"Barbell Bench Press",
            "sets":[
              {
                "weightKg":%s,
                "repetitions":8,
                "completedAt":"%s"
              },
              {
                "weightKg":82.5,
                "repetitions":6
              }
            ]
          },
          {
            "exerciseCode":"back-squat",
            "displayName":"Back Squat",
            "sets":[
              {
                "weightKg":100,
                "repetitions":5,
                "completedAt":"%s"
              }
            ]
          }
        ]
      }
      """.formatted(
        startedAt,
        completedAt,
        benchWeight,
        startedAt.replace("T10:00", "T10:20"),
        startedAt.replace("T10:00", "T10:50")
      );

    return send(
      HttpRequest
        .newBuilder(workoutsUri(""))
        .header("Authorization", "Bearer " + token)
        .header("Idempotency-Key", uniqueValue("history"))
        .header("Content-Type", "application/json")
        .POST(HttpRequest.BodyPublishers.ofString(body))
        .build()
    );
  }

  private HttpResponse<String> get(String token, String suffix)
    throws Exception {
    return send(
      HttpRequest
        .newBuilder(workoutsUri(suffix))
        .header("Authorization", "Bearer " + token)
        .GET()
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

  private URI workoutsUri(String suffix) {
    return URI.create(
      "http://localhost:" + port + "/api/v1/workouts" + suffix
    );
  }

  private JsonNode json(String body) throws Exception {
    return objectMapper.readTree(body);
  }

  private String uniqueValue(String prefix) {
    return prefix + "-" + UUID.randomUUID();
  }
}
