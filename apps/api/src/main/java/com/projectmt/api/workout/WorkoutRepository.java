package com.projectmt.api.workout;

import java.math.BigDecimal;
import java.sql.ResultSet;
import java.sql.SQLException;
import java.sql.Timestamp;
import java.time.Duration;
import java.time.Instant;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
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

  List<WorkoutHistoryItem> findHistory(
    UUID userId,
    WorkoutHistoryFilter filter
  ) {
    var sql = new StringBuilder("""
      SELECT
        session.id,
        session.started_at,
        session.completed_at,
        session.duration_seconds,
        session.notes,
        (
          SELECT COUNT(*)
          FROM workout_exercises exercise
          WHERE exercise.workout_session_id = session.id
            AND exercise.user_id = session.user_id
        ) AS exercise_count,
        (
          SELECT COUNT(*)
          FROM workout_sets workout_set
          WHERE workout_set.workout_session_id = session.id
            AND workout_set.user_id = session.user_id
        ) AS set_count,
        (
          SELECT COUNT(*)
          FROM workout_sets workout_set
          WHERE workout_set.workout_session_id = session.id
            AND workout_set.user_id = session.user_id
            AND workout_set.completed_at IS NOT NULL
        ) AS completed_set_count,
        COALESCE((
          SELECT SUM(workout_set.weight_kg * workout_set.repetitions)
          FROM workout_sets workout_set
          WHERE workout_set.workout_session_id = session.id
            AND workout_set.user_id = session.user_id
            AND workout_set.completed_at IS NOT NULL
        ), 0) AS completed_volume_kg
      FROM workout_sessions session
      WHERE session.user_id = :userId
        AND session.status = 'COMPLETED'
      """);

    if (filter.cursor() != null) {
      sql.append("""
          AND (session.completed_at, session.id)
            < (:cursorCompletedAt, :cursorId)
        """);
    }
    if (filter.exerciseCode() != null) {
      sql.append("""
          AND EXISTS (
            SELECT 1
            FROM workout_exercises filtered_exercise
            WHERE filtered_exercise.workout_session_id = session.id
              AND filtered_exercise.user_id = session.user_id
              AND filtered_exercise.exercise_code = :exerciseCode
          )
        """);
    }
    if (filter.from() != null) {
      sql.append(" AND session.completed_at >= :fromAt\n");
    }
    if (filter.to() != null) {
      sql.append(" AND session.completed_at <= :toAt\n");
    }
    sql.append("""
      ORDER BY session.completed_at DESC, session.id DESC
      LIMIT :fetchLimit
      """);

    var query = jdbcClient
      .sql(sql.toString())
      .param("userId", userId)
      .param("fetchLimit", filter.limit() + 1);

    if (filter.cursor() != null) {
      query
        .param(
          "cursorCompletedAt",
          Timestamp.from(filter.cursor().completedAt())
        )
        .param("cursorId", filter.cursor().id());
    }
    if (filter.exerciseCode() != null) {
      query.param("exerciseCode", filter.exerciseCode());
    }
    if (filter.from() != null) {
      query.param("fromAt", Timestamp.from(filter.from()));
    }
    if (filter.to() != null) {
      query.param("toAt", Timestamp.from(filter.to()));
    }

    return query
      .query(WorkoutRepository::mapHistoryItem)
      .list();
  }

  Optional<WorkoutDetail> findDetail(UUID userId, UUID workoutId) {
    var session = jdbcClient
      .sql("""
        SELECT
          id,
          started_at,
          completed_at,
          duration_seconds,
          notes
        FROM workout_sessions
        WHERE id = :workoutId
          AND user_id = :userId
          AND status = 'COMPLETED'
        """)
      .param("workoutId", workoutId)
      .param("userId", userId)
      .query((resultSet, rowNumber) ->
        new DetailSession(
          resultSet.getObject("id", UUID.class),
          resultSet.getTimestamp("started_at").toInstant(),
          resultSet.getTimestamp("completed_at").toInstant(),
          resultSet.getLong("duration_seconds"),
          resultSet.getString("notes")
        )
      )
      .optional();

    if (session.isEmpty()) {
      return Optional.empty();
    }

    List<ExerciseRow> exercises = jdbcClient
      .sql("""
        SELECT id, position, exercise_code, display_name, notes
        FROM workout_exercises
        WHERE workout_session_id = :workoutId
          AND user_id = :userId
        ORDER BY position
        """)
      .param("workoutId", workoutId)
      .param("userId", userId)
      .query((resultSet, rowNumber) ->
        new ExerciseRow(
          resultSet.getObject("id", UUID.class),
          resultSet.getInt("position"),
          resultSet.getString("exercise_code"),
          resultSet.getString("display_name"),
          resultSet.getString("notes")
        )
      )
      .list();

    Map<UUID, List<WorkoutSetDetail>> setsByExercise =
      new LinkedHashMap<>();
    jdbcClient
      .sql("""
        SELECT
          workout_exercise_id,
          position,
          weight_kg,
          repetitions,
          completed_at,
          notes
        FROM workout_sets
        WHERE workout_session_id = :workoutId
          AND user_id = :userId
        ORDER BY workout_exercise_id, position
        """)
      .param("workoutId", workoutId)
      .param("userId", userId)
      .query((resultSet, rowNumber) -> {
        UUID exerciseId = resultSet.getObject(
          "workout_exercise_id",
          UUID.class
        );
        setsByExercise
          .computeIfAbsent(exerciseId, ignored -> new ArrayList<>())
          .add(mapSetDetail(resultSet));
        return exerciseId;
      })
      .list();

    DetailSession storedSession = session.orElseThrow();
    List<WorkoutExerciseDetail> details = exercises
      .stream()
      .map(exercise ->
        new WorkoutExerciseDetail(
          exercise.position(),
          exercise.exerciseCode(),
          exercise.displayName(),
          exercise.notes(),
          List.copyOf(
            setsByExercise.getOrDefault(exercise.id(), List.of())
          )
        )
      )
      .toList();

    return Optional.of(
      new WorkoutDetail(
        storedSession.id(),
        storedSession.startedAt(),
        storedSession.completedAt(),
        storedSession.durationSeconds(),
        storedSession.notes(),
        details
      )
    );
  }

  Optional<PreviousExercisePerformance> findPreviousPerformance(
    UUID userId,
    String exerciseCode
  ) {
    var previous = jdbcClient
      .sql("""
        SELECT
          session.id AS workout_id,
          session.completed_at,
          exercise.id AS exercise_id,
          exercise.exercise_code,
          exercise.display_name
        FROM workout_sessions session
        JOIN workout_exercises exercise
          ON exercise.workout_session_id = session.id
          AND exercise.user_id = session.user_id
        WHERE session.user_id = :userId
          AND session.status = 'COMPLETED'
          AND exercise.exercise_code = :exerciseCode
          AND EXISTS (
            SELECT 1
            FROM workout_sets workout_set
            WHERE workout_set.workout_exercise_id = exercise.id
              AND workout_set.user_id = session.user_id
              AND workout_set.completed_at IS NOT NULL
          )
        ORDER BY session.completed_at DESC, session.id DESC
        LIMIT 1
        """)
      .param("userId", userId)
      .param("exerciseCode", exerciseCode)
      .query((resultSet, rowNumber) ->
        new PreviousRow(
          resultSet.getObject("workout_id", UUID.class),
          resultSet.getTimestamp("completed_at").toInstant(),
          resultSet.getObject("exercise_id", UUID.class),
          resultSet.getString("exercise_code"),
          resultSet.getString("display_name")
        )
      )
      .optional();

    if (previous.isEmpty()) {
      return Optional.empty();
    }

    PreviousRow row = previous.orElseThrow();
    List<WorkoutSetDetail> sets = jdbcClient
      .sql("""
        SELECT position, weight_kg, repetitions, completed_at, notes
        FROM workout_sets
        WHERE workout_exercise_id = :exerciseId
          AND user_id = :userId
          AND completed_at IS NOT NULL
        ORDER BY position
        """)
      .param("exerciseId", row.exerciseId())
      .param("userId", userId)
      .query((resultSet, rowNumber) -> mapSetDetail(resultSet))
      .list();

    return Optional.of(
      new PreviousExercisePerformance(
        row.workoutId(),
        row.completedAt(),
        row.exerciseCode(),
        row.displayName(),
        sets
      )
    );
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

  private static WorkoutHistoryItem mapHistoryItem(
    ResultSet resultSet,
    int rowNumber
  ) throws SQLException {
    return new WorkoutHistoryItem(
      resultSet.getObject("id", UUID.class),
      resultSet.getTimestamp("started_at").toInstant(),
      resultSet.getTimestamp("completed_at").toInstant(),
      resultSet.getLong("duration_seconds"),
      resultSet.getString("notes"),
      resultSet.getInt("exercise_count"),
      resultSet.getInt("set_count"),
      resultSet.getInt("completed_set_count"),
      resultSet.getBigDecimal("completed_volume_kg")
    );
  }

  private static WorkoutSetDetail mapSetDetail(
    ResultSet resultSet
  ) throws SQLException {
    Timestamp completedAt = resultSet.getTimestamp("completed_at");
    return new WorkoutSetDetail(
      resultSet.getInt("position"),
      resultSet.getBigDecimal("weight_kg"),
      resultSet.getInt("repetitions"),
      completedAt == null ? null : completedAt.toInstant(),
      resultSet.getString("notes")
    );
  }

  private record DetailSession(
    UUID id,
    Instant startedAt,
    Instant completedAt,
    long durationSeconds,
    String notes
  ) {}

  private record ExerciseRow(
    UUID id,
    int position,
    String exerciseCode,
    String displayName,
    String notes
  ) {}

  private record PreviousRow(
    UUID workoutId,
    Instant completedAt,
    UUID exerciseId,
    String exerciseCode,
    String displayName
  ) {}
}
