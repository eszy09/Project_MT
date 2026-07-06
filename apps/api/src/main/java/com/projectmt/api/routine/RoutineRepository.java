package com.projectmt.api.routine;

import java.sql.Timestamp;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;
import org.springframework.jdbc.core.simple.JdbcClient;
import org.springframework.stereotype.Repository;

@Repository
class RoutineRepository {

  private final JdbcClient jdbc;

  RoutineRepository(JdbcClient jdbc) {
    this.jdbc = jdbc;
  }

  UUID insert(UUID userId, RoutineCommand command) {
    return jdbc.sql("""
      INSERT INTO routines (user_id, name, description, muscle_group)
      VALUES (:userId, :name, :description, :muscleGroup)
      RETURNING id
      """)
      .param("userId", userId).param("name", command.name())
      .param("description", command.description())
      .param("muscleGroup", command.muscleGroup())
      .query(UUID.class).single();
  }

  boolean update(UUID userId, UUID id, int version, RoutineCommand command) {
    return jdbc.sql("""
      UPDATE routines
      SET name=:name, description=:description, muscle_group=:muscleGroup,
          version=version+1
      WHERE id=:id AND user_id=:userId AND version=:version
      """)
      .param("name", command.name()).param("description", command.description())
      .param("muscleGroup", command.muscleGroup()).param("id", id)
      .param("userId", userId).param("version", version).update() == 1;
  }

  void replaceChildren(UUID userId, UUID id, RoutineCommand command) {
    jdbc.sql("DELETE FROM routine_exercises WHERE routine_id=:id AND user_id=:userId")
      .param("id", id).param("userId", userId).update();
    for (int i = 0; i < command.exercises().size(); i++) {
      var exercise = command.exercises().get(i);
      UUID exerciseId = jdbc.sql("""
        INSERT INTO routine_exercises
          (routine_id,user_id,position,exercise_code,display_name,notes)
        VALUES (:routineId,:userId,:position,:code,:name,:notes)
        RETURNING id
        """)
        .param("routineId", id).param("userId", userId).param("position", i + 1)
        .param("code", exercise.exerciseCode()).param("name", exercise.displayName())
        .param("notes", exercise.notes()).query(UUID.class).single();
      for (int j = 0; j < exercise.sets().size(); j++) {
        var set = exercise.sets().get(j);
        jdbc.sql("""
          INSERT INTO routine_set_templates
            (routine_exercise_id,routine_id,user_id,position,target_weight_kg,target_repetitions,notes)
          VALUES (:exerciseId,:routineId,:userId,:position,:weight,:reps,:notes)
          """)
          .param("exerciseId", exerciseId).param("routineId", id)
          .param("userId", userId).param("position", j + 1)
          .param("weight", set.targetWeightKg()).param("reps", set.targetRepetitions())
          .param("notes", set.notes()).update();
      }
    }
  }

  List<RoutineView> list(UUID userId, boolean includeArchived) {
    String suffix = includeArchived ? "" : " AND archived_at IS NULL";
    return jdbc.sql("""
      SELECT id FROM routines WHERE user_id=:userId
      """ + suffix + " ORDER BY archived_at NULLS FIRST, updated_at DESC")
      .param("userId", userId).query(UUID.class).list().stream()
      .map(id -> find(userId, id).orElseThrow()).toList();
  }

  Optional<RoutineView> find(UUID userId, UUID id) {
    var routine = jdbc.sql("""
      SELECT * FROM routines WHERE id=:id AND user_id=:userId
      """).param("id", id).param("userId", userId)
      .query((rs, row) -> new RoutineHeader(
        rs.getObject("id", UUID.class), rs.getString("name"),
        rs.getString("description"), rs.getString("muscle_group"),
        rs.getInt("version"),
        rs.getTimestamp("archived_at") == null ? null : rs.getTimestamp("archived_at").toInstant(),
        rs.getTimestamp("created_at").toInstant(), rs.getTimestamp("updated_at").toInstant()
      )).optional();
    if (routine.isEmpty()) return Optional.empty();
    var exercises = jdbc.sql("""
      SELECT id,position,exercise_code,display_name,notes FROM routine_exercises
      WHERE routine_id=:id AND user_id=:userId ORDER BY position
      """).param("id", id).param("userId", userId)
      .query((rs,row) -> new ExerciseRow(rs.getObject("id", UUID.class),
        rs.getInt("position"),rs.getString("exercise_code"),
        rs.getString("display_name"),rs.getString("notes"))).list();
    Map<UUID,List<RoutineSetView>> sets = new LinkedHashMap<>();
    jdbc.sql("""
      SELECT routine_exercise_id,position,target_weight_kg,target_repetitions,notes
      FROM routine_set_templates WHERE routine_id=:id AND user_id=:userId
      ORDER BY routine_exercise_id,position
      """).param("id", id).param("userId", userId).query((rs,row) -> {
        UUID exerciseId=rs.getObject("routine_exercise_id",UUID.class);
        sets.computeIfAbsent(exerciseId, ignored -> new ArrayList<>()).add(
          new RoutineSetView(rs.getInt("position"),rs.getBigDecimal("target_weight_kg"),
            rs.getInt("target_repetitions"),rs.getString("notes")));
        return exerciseId;
      }).list();
    var header=routine.orElseThrow();
    return Optional.of(new RoutineView(header.id(),header.name(),header.description(),
      header.muscleGroup(),header.version(),header.archivedAt(),header.createdAt(),
      header.updatedAt(),exercises.stream().map(e -> new RoutineExerciseView(
        e.position(),e.code(),e.name(),e.notes(),
        List.copyOf(sets.getOrDefault(e.id(),List.of())))).toList()));
  }

  boolean setArchived(UUID userId, UUID id, int version, boolean archived) {
    return jdbc.sql("""
      UPDATE routines SET archived_at=:archivedAt, version=version+1
      WHERE id=:id AND user_id=:userId AND version=:version
      """).param("archivedAt", archived ? Timestamp.from(java.time.Instant.now()) : null)
      .param("id",id).param("userId",userId).param("version",version).update()==1;
  }

  boolean deleteArchived(UUID userId, UUID id) {
    return jdbc.sql("""
      DELETE FROM routines WHERE id=:id AND user_id=:userId AND archived_at IS NOT NULL
      """).param("id",id).param("userId",userId).update()==1;
  }

  private record RoutineHeader(UUID id,String name,String description,String muscleGroup,
    int version,java.time.Instant archivedAt,java.time.Instant createdAt,java.time.Instant updatedAt) {}
  private record ExerciseRow(UUID id,int position,String code,String name,String notes) {}
}
