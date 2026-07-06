package com.projectmt.api;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;

import com.projectmt.api.support.PostgresTestConfiguration;
import com.projectmt.api.support.TestSecurityConfiguration;
import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.util.List;
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
class WorkoutCompletionIntegrationTests {

  private static final HttpClient HTTP_CLIENT =
    HttpClient.newHttpClient();

  @LocalServerPort
  private int port;

  @Autowired
  private JdbcTemplate jdbcTemplate;

  @Test
  void completedWorkoutPersistsAsAnOwnedOrderedHierarchy()
    throws Exception {
    String token = uniqueValue("workout-owner");
    String idempotencyKey = uniqueValue("completion");

    var response = saveWorkout(
      token,
      idempotencyKey,
      completedWorkoutBody()
    );

    assertEquals(201, response.statusCode());
    assertEquals(
      "false",
      response
        .headers()
        .firstValue("Idempotency-Replayed")
        .orElseThrow()
    );
    assertTrue(response.body().contains("\"status\":\"COMPLETED\""));
    assertTrue(response.body().contains("\"durationSeconds\":3600"));
    assertTrue(response.body().contains("\"exerciseCount\":2"));
    assertTrue(response.body().contains("\"setCount\":3"));
    assertTrue(response.body().contains("\"completedSetCount\":2"));

    UUID sessionId = sessionId(idempotencyKey);
    UUID userId = userId(token);

    assertEquals(
      List.of(1, 2),
      jdbcTemplate.queryForList(
        """
        SELECT position
        FROM workout_exercises
        WHERE workout_session_id = ?
          AND user_id = ?
        ORDER BY position
        """,
        Integer.class,
        sessionId,
        userId
      )
    );

    assertEquals(
      List.of(1, 2),
      jdbcTemplate.queryForList(
        """
        SELECT workout_set.position
        FROM workout_sets workout_set
        JOIN workout_exercises exercise
          ON exercise.id = workout_set.workout_exercise_id
        WHERE exercise.workout_session_id = ?
          AND exercise.position = 1
          AND workout_set.user_id = ?
        ORDER BY workout_set.position
        """,
        Integer.class,
        sessionId,
        userId
      )
    );
  }

  @Test
  void identicalCompletionRetryReturnsTheOriginalWorkout()
    throws Exception {
    String token = uniqueValue("retry-owner");
    String idempotencyKey = uniqueValue("retry");
    String body = completedWorkoutBody();

    var created = saveWorkout(token, idempotencyKey, body);
    var replayed = saveWorkout(token, idempotencyKey, body);

    assertEquals(201, created.statusCode());
    assertEquals(200, replayed.statusCode());
    assertEquals(created.body(), replayed.body());
    assertEquals(
      "true",
      replayed
        .headers()
        .firstValue("Idempotency-Replayed")
        .orElseThrow()
    );
    assertEquals(1, sessionCount(idempotencyKey));
  }

  @Test
  void reusedIdempotencyKeyWithDifferentPayloadConflicts()
    throws Exception {
    String token = uniqueValue("conflict-owner");
    String idempotencyKey = uniqueValue("conflict");

    var created = saveWorkout(
      token,
      idempotencyKey,
      completedWorkoutBody()
    );
    var conflict = saveWorkout(
      token,
      idempotencyKey,
      completedWorkoutBody().replace(
        "\"Evening strength\"",
        "\"Changed workout\""
      )
    );

    assertEquals(201, created.statusCode());
    assertEquals(409, conflict.statusCode());
    assertTrue(conflict.body().contains("\"code\":\"CONFLICT\""));
    assertEquals(1, sessionCount(idempotencyKey));
  }

  @Test
  void persistenceFailureRollsBackTheCompleteHierarchy()
    throws Exception {
    String token = uniqueValue("rollback-owner");
    String idempotencyKey = uniqueValue("rollback");

    installSetFailureTrigger();

    try {
      var response = saveWorkout(
        token,
        idempotencyKey,
        completedWorkoutBody()
      );

      assertEquals(500, response.statusCode());
      assertTrue(
        response.body().contains("\"code\":\"INTERNAL_ERROR\"")
      );
    } finally {
      removeSetFailureTrigger();
    }

    assertEquals(0, sessionCount(idempotencyKey));
    assertEquals(
      0,
      jdbcTemplate.queryForObject(
        """
        SELECT COUNT(*)
        FROM workout_exercises exercise
        JOIN workout_sessions session
          ON session.id = exercise.workout_session_id
        WHERE session.completion_key = ?
        """,
        Integer.class,
        idempotencyKey
      )
    );
  }

  @Test
  void workoutRequiresAtLeastOneCompletedSet()
    throws Exception {
    String idempotencyKey = uniqueValue("no-completed-set");
    String incompleteBody = completedWorkoutBody().replace(
      "\"completedAt\":\"2026-07-06T10:20:00Z\"",
      "\"completedAt\":null"
    ).replace(
      "\"completedAt\":\"2026-07-06T10:50:00Z\"",
      "\"completedAt\":null"
    );

    var response = saveWorkout(
      uniqueValue("validation-owner"),
      idempotencyKey,
      incompleteBody
    );

    assertEquals(400, response.statusCode());
    assertTrue(
      response.body().contains("\"code\":\"VALIDATION_FAILED\"")
    );
    assertTrue(
      response.body().contains(
        "At least one set must be completed."
      )
    );
    assertEquals(0, sessionCount(idempotencyKey));
  }

  @Test
  void setCompletionMustFallWithinTheWorkout()
    throws Exception {
    String idempotencyKey = uniqueValue("invalid-set-time");
    String invalidBody = completedWorkoutBody().replace(
      "2026-07-06T10:20:00Z",
      "2026-07-06T12:20:00Z"
    );

    var response = saveWorkout(
      uniqueValue("time-owner"),
      idempotencyKey,
      invalidBody
    );

    assertEquals(400, response.statusCode());
    assertTrue(
      response.body().contains(
        "Set completion time must be within the workout."
      )
    );
    assertEquals(0, sessionCount(idempotencyKey));
  }

  @Test
  void idempotencyKeyAndAuthenticationAreRequired()
    throws Exception {
    var missingKey = send(
      HttpRequest
        .newBuilder(workoutsUri())
        .header(
          "Authorization",
          "Bearer " + uniqueValue("missing-key-owner")
        )
        .header("Content-Type", MediaType.APPLICATION_JSON_VALUE)
        .POST(
          HttpRequest.BodyPublishers.ofString(
            completedWorkoutBody()
          )
        )
        .build()
    );

    var unauthenticated = send(
      HttpRequest
        .newBuilder(workoutsUri())
        .header("Idempotency-Key", uniqueValue("unauthenticated"))
        .header("Content-Type", MediaType.APPLICATION_JSON_VALUE)
        .POST(
          HttpRequest.BodyPublishers.ofString(
            completedWorkoutBody()
          )
        )
        .build()
    );

    assertEquals(400, missingKey.statusCode());
    assertTrue(
      missingKey.body().contains("\"code\":\"VALIDATION_FAILED\"")
    );
    assertEquals(401, unauthenticated.statusCode());
    assertTrue(
      unauthenticated.body().contains("\"code\":\"UNAUTHENTICATED\"")
    );
  }

  private HttpResponse<String> saveWorkout(
    String token,
    String idempotencyKey,
    String body
  ) throws Exception {
    return send(
      HttpRequest
        .newBuilder(workoutsUri())
        .header("Authorization", "Bearer " + token)
        .header("Idempotency-Key", idempotencyKey)
        .header("Content-Type", MediaType.APPLICATION_JSON_VALUE)
        .POST(HttpRequest.BodyPublishers.ofString(body))
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

  private URI workoutsUri() {
    return URI.create(
      "http://localhost:" + port + "/api/v1/workouts"
    );
  }

  private UUID sessionId(String idempotencyKey) {
    return jdbcTemplate.queryForObject(
      """
      SELECT id
      FROM workout_sessions
      WHERE completion_key = ?
      """,
      UUID.class,
      idempotencyKey
    );
  }

  private UUID userId(String subject) {
    return jdbcTemplate.queryForObject(
      """
      SELECT user_id
      FROM user_identities
      WHERE subject = ?
      """,
      UUID.class,
      subject
    );
  }

  private int sessionCount(String idempotencyKey) {
    return jdbcTemplate.queryForObject(
      """
      SELECT COUNT(*)
      FROM workout_sessions
      WHERE completion_key = ?
      """,
      Integer.class,
      idempotencyKey
    );
  }

  private void installSetFailureTrigger() {
    removeSetFailureTrigger();

    jdbcTemplate.execute(
      """
      CREATE FUNCTION fail_workout_set_insert()
      RETURNS TRIGGER
      LANGUAGE plpgsql
      AS $$
      BEGIN
          RAISE EXCEPTION 'forced workout set persistence failure';
      END;
      $$
      """
    );
    jdbcTemplate.execute(
      """
      CREATE TRIGGER trg_fail_workout_set_insert
      BEFORE INSERT ON workout_sets
      FOR EACH ROW
      EXECUTE FUNCTION fail_workout_set_insert()
      """
    );
  }

  private void removeSetFailureTrigger() {
    jdbcTemplate.execute(
      """
      DROP TRIGGER IF EXISTS trg_fail_workout_set_insert
      ON workout_sets
      """
    );
    jdbcTemplate.execute(
      "DROP FUNCTION IF EXISTS fail_workout_set_insert()"
    );
  }

  private String completedWorkoutBody() {
    return """
      {
        "startedAt":"2026-07-06T10:00:00Z",
        "completedAt":"2026-07-06T11:00:00Z",
        "notes":"Evening strength",
        "exercises":[
          {
            "exerciseCode":"barbell-bench-press",
            "displayName":"Barbell Bench Press",
            "sets":[
              {
                "weightKg":80,
                "repetitions":8,
                "completedAt":"2026-07-06T10:20:00Z"
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
                "completedAt":"2026-07-06T10:50:00Z"
              }
            ]
          }
        ]
      }
      """;
  }

  private String uniqueValue(String prefix) {
    return prefix + "-" + UUID.randomUUID();
  }
}
