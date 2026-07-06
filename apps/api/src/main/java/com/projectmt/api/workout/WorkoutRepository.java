package com.projectmt.api.workout;

import java.sql.ResultSet;
import java.sql.SQLException;
import java.sql.Timestamp;
import java.time.Duration;
import java.time.Instant;
import java.util.Optional;
import java.util.UUID;
import org.springframework.jdbc.core.simple.JdbcClient;
import org.springframework.stereotype.Repository;

@Repository
public class WorkoutRepository {

  private final JdbcClient jdbcClient;

  public WorkoutRepository(JdbcClient jdbcClient) {
    this.jdbcClient = jdbcClient;
  }

  Optional<UUID> insertCompletedSession(
    UUID userId,
    String completionKey,
    String requestFingerprint,
    WorkoutCompletionCommand command
  ) {
    long durationSeconds = Duration
      .between(command.startedAt(), command.completedAt())
      .toSeconds();

    return jdbcClient
      .sql("""
        INSERT INTO workout_sessions (
          user_id,
          status,
          started_at,
          completed_at,
          duration_seconds,
          notes,
          completion_key,
          request_fingerprint
        )
        VALUES (
          :userId,
          'COMPLETED',
          :startedAt,
          :completedAt,
          :durationSeconds,
          :notes,
          :completionKey,
          :requestFingerprint
        )
        ON CONFLICT (user_id, completion_key) DO NOTHING
        RETURNING id
        """)
      .param("userId", userId)
      .param("startedAt", Timestamp.from(command.startedAt()))
      .param("completedAt", Timestamp.from(command.completedAt()))
      .param("durationSeconds", durationSeconds)
      .param("notes", command.notes())
      .param("completionKey", completionKey)
      .param("requestFingerprint", requestFingerprint)
      .query(UUID.class)
      .optional();
  }

  UUID insertExercise(
    UUID sessionId,
    UUID userId,
    int position,
    WorkoutExerciseCommand exercise
  ) {
    return jdbcClient
      .sql("""
        INSERT INTO workout_exercises (
          workout_session_id,
          user_id,
          position,
          exercise_code,
          display_name,
          notes
        )
        VALUES (
          :sessionId,
          :userId,
          :position,
          :exerciseCode,
          :displayName,
          :notes
        )
        RETURNING id
        """)
      .param("sessionId", sessionId)
      .param("userId", userId)
      .param("position", position)
      .param("exerciseCode", exercise.exerciseCode())
      .param("displayName", exercise.displayName())
      .param("notes", exercise.notes())
      .query(UUID.class)
      .single();
  }

  void insertSet(
    UUID exerciseId,
    UUID sessionId,
    UUID userId,
    int position,
    WorkoutSetCommand set
  ) {
    jdbcClient
      .sql("""
        INSERT INTO workout_sets (
          workout_exercise_id,
          workout_session_id,
          user_id,
          position,
          weight_kg,
          repetitions,
          completed_at,
          notes
        )
        VALUES (
          :exerciseId,
          :sessionId,
          :userId,
          :position,
          :weightKg,
          :repetitions,
          :completedAt,
          :notes
        )
        """)
      .param("exerciseId", exerciseId)
      .param("sessionId", sessionId)
      .param("userId", userId)
      .param("position", position)
      .param("weightKg", set.weightKg())
      .param("repetitions", set.repetitions())
      .param("completedAt", timestamp(set.completedAt()))
      .param("notes", set.notes())
      .update();
  }

  Optional<StoredWorkout> findByCompletionKeyForUser(
    UUID userId,
    String completionKey
  ) {
    return jdbcClient
      .sql("""
        SELECT
          session.id,
          session.status,
          session.started_at,
          session.completed_at,
          session.duration_seconds,
          session.notes,
          session.created_at,
          session.request_fingerprint,
          COUNT(DISTINCT exercise.id) AS exercise_count,
          COUNT(workout_set.id) AS set_count,
          COUNT(workout_set.id) FILTER (
            WHERE workout_set.completed_at IS NOT NULL
          ) AS completed_set_count
        FROM workout_sessions session
        LEFT JOIN workout_exercises exercise
          ON exercise.workout_session_id = session.id
          AND exercise.user_id = session.user_id
        LEFT JOIN workout_sets workout_set
          ON workout_set.workout_exercise_id = exercise.id
          AND workout_set.workout_session_id = session.id
          AND workout_set.user_id = session.user_id
        WHERE session.user_id = :userId
          AND session.completion_key = :completionKey
        GROUP BY session.id
        """)
      .param("userId", userId)
      .param("completionKey", completionKey)
      .query(WorkoutRepository::mapStoredWorkout)
      .optional();
  }

  private Timestamp timestamp(Instant instant) {
    return instant == null ? null : Timestamp.from(instant);
  }

  private static StoredWorkout mapStoredWorkout(
    ResultSet resultSet,
    int rowNumber
  ) throws SQLException {
    SavedWorkout workout = new SavedWorkout(
      resultSet.getObject("id", UUID.class),
      WorkoutStatus.valueOf(resultSet.getString("status")),
      resultSet.getTimestamp("started_at").toInstant(),
      resultSet.getTimestamp("completed_at").toInstant(),
      resultSet.getLong("duration_seconds"),
      resultSet.getString("notes"),
      resultSet.getInt("exercise_count"),
      resultSet.getInt("set_count"),
      resultSet.getInt("completed_set_count"),
      resultSet.getTimestamp("created_at").toInstant()
    );

    return new StoredWorkout(
      workout,
      resultSet.getString("request_fingerprint")
    );
  }
}
