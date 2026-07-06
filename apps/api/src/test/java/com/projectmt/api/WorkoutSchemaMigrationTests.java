package com.projectmt.api;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;

import com.projectmt.api.support.PostgresTestConfiguration;
import java.util.List;
import java.util.UUID;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.context.annotation.Import;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.jdbc.core.JdbcTemplate;

@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.NONE)
@Import(PostgresTestConfiguration.class)
class WorkoutSchemaMigrationTests {

  @Autowired
  private JdbcTemplate jdbcTemplate;

  @Test
  void workoutExerciseMustBelongToTheSessionOwner() {
    UUID sessionOwnerId = createUser();
    UUID otherUserId = createUser();
    UUID sessionId = createSession(sessionOwnerId);

    assertThrows(
      DataIntegrityViolationException.class,
      () -> createExercise(sessionId, otherUserId, 1)
    );
  }

  @Test
  void workoutSetMustBelongToItsExerciseSessionAndOwner() {
    UUID sessionOwnerId = createUser();
    UUID otherUserId = createUser();
    UUID sessionId = createSession(sessionOwnerId);
    UUID exerciseId = createExercise(sessionId, sessionOwnerId, 1);

    assertThrows(
      DataIntegrityViolationException.class,
      () -> jdbcTemplate.update(
        """
        INSERT INTO workout_sets (
          workout_exercise_id,
          workout_session_id,
          user_id,
          position
        )
        VALUES (?, ?, ?, ?)
        """,
        exerciseId,
        sessionId,
        otherUserId,
        1
      )
    );
  }

  @Test
  void exerciseAndSetPositionsAreUniqueWithinTheirParents() {
    UUID userId = createUser();
    UUID sessionId = createSession(userId);
    UUID exerciseId = createExercise(sessionId, userId, 1);

    assertThrows(
      DataIntegrityViolationException.class,
      () -> createExercise(sessionId, userId, 1)
    );

    createSet(exerciseId, sessionId, userId, 1);

    assertThrows(
      DataIntegrityViolationException.class,
      () -> createSet(exerciseId, sessionId, userId, 1)
    );
  }

  @Test
  void completedSessionRequiresCompletionTimeAndDuration() {
    UUID userId = createUser();

    assertThrows(
      DataIntegrityViolationException.class,
      () -> jdbcTemplate.update(
        """
        INSERT INTO workout_sessions (user_id, status)
        VALUES (?, 'COMPLETED')
        """,
        userId
      )
    );

    assertThrows(
      DataIntegrityViolationException.class,
      () -> jdbcTemplate.update(
        """
        INSERT INTO workout_sessions (
          user_id,
          status,
          completed_at,
          duration_seconds
        )
        VALUES (?, 'IN_PROGRESS', CURRENT_TIMESTAMP, 600)
        """,
        userId
      )
    );
  }

  @Test
  void completedSetRequiresWeightAndRepetitions() {
    UUID userId = createUser();
    UUID sessionId = createSession(userId);
    UUID exerciseId = createExercise(sessionId, userId, 1);

    assertThrows(
      DataIntegrityViolationException.class,
      () -> jdbcTemplate.update(
        """
        INSERT INTO workout_sets (
          workout_exercise_id,
          workout_session_id,
          user_id,
          position,
          completed_at
        )
        VALUES (?, ?, ?, ?, CURRENT_TIMESTAMP)
        """,
        exerciseId,
        sessionId,
        userId,
        1
      )
    );
  }

  @Test
  void deletingSessionCascadesThroughWorkoutHierarchy() {
    UUID userId = createUser();
    UUID sessionId = createSession(userId);
    UUID exerciseId = createExercise(sessionId, userId, 1);
    createSet(exerciseId, sessionId, userId, 1);

    jdbcTemplate.update(
      "DELETE FROM workout_sessions WHERE id = ? AND user_id = ?",
      sessionId,
      userId
    );

    Integer exerciseCount = jdbcTemplate.queryForObject(
      "SELECT COUNT(*) FROM workout_exercises WHERE workout_session_id = ?",
      Integer.class,
      sessionId
    );
    Integer setCount = jdbcTemplate.queryForObject(
      "SELECT COUNT(*) FROM workout_sets WHERE workout_session_id = ?",
      Integer.class,
      sessionId
    );

    assertEquals(0, exerciseCount);
    assertEquals(0, setCount);
  }

  @Test
  void workoutHistoryIndexesAreInstalled() {
    List<String> indexNames = jdbcTemplate.queryForList(
      """
      SELECT indexname
      FROM pg_indexes
      WHERE schemaname = 'public'
        AND indexname IN (
          'ix_workout_sessions_user_started_at',
          'ix_workout_sessions_user_completed_at',
          'ix_workout_sessions_user_history_cursor',
          'ix_workout_exercises_user_code_session'
        )
      ORDER BY indexname
      """,
      String.class
    );

    assertEquals(4, indexNames.size());
    assertTrue(
      indexNames.contains("ix_workout_sessions_user_started_at")
    );
    assertTrue(
      indexNames.contains("ix_workout_sessions_user_completed_at")
    );
    assertTrue(
      indexNames.contains("ix_workout_sessions_user_history_cursor")
    );
    assertTrue(
      indexNames.contains("ix_workout_exercises_user_code_session")
    );
  }

  private UUID createUser() {
    return jdbcTemplate.queryForObject(
      "INSERT INTO app_users DEFAULT VALUES RETURNING id",
      UUID.class
    );
  }

  private UUID createSession(UUID userId) {
    return jdbcTemplate.queryForObject(
      """
      INSERT INTO workout_sessions (user_id)
      VALUES (?)
      RETURNING id
      """,
      UUID.class,
      userId
    );
  }

  private UUID createExercise(
    UUID sessionId,
    UUID userId,
    int position
  ) {
    return jdbcTemplate.queryForObject(
      """
      INSERT INTO workout_exercises (
        workout_session_id,
        user_id,
        position,
        exercise_code,
        display_name
      )
      VALUES (?, ?, ?, ?, ?)
      RETURNING id
      """,
      UUID.class,
      sessionId,
      userId,
      position,
      "exercise-" + UUID.randomUUID(),
      "Test exercise"
    );
  }

  private void createSet(
    UUID exerciseId,
    UUID sessionId,
    UUID userId,
    int position
  ) {
    jdbcTemplate.update(
      """
      INSERT INTO workout_sets (
        workout_exercise_id,
        workout_session_id,
        user_id,
        position
      )
      VALUES (?, ?, ?, ?)
      """,
      exerciseId,
      sessionId,
      userId,
      position
    );
  }
}
