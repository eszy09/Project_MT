package com.projectmt.api.routine;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.List;
import java.util.UUID;

record RoutineCommand(
  String name,
  String description,
  String muscleGroup,
  List<RoutineExerciseCommand> exercises
) {}

record RoutineExerciseCommand(
  String exerciseCode,
  String displayName,
  String notes,
  List<RoutineSetCommand> sets
) {}

record RoutineSetCommand(
  BigDecimal targetWeightKg,
  int targetRepetitions,
  String notes
) {}

record RoutineView(
  UUID id,
  String name,
  String description,
  String muscleGroup,
  int version,
  Instant archivedAt,
  Instant createdAt,
  Instant updatedAt,
  List<RoutineExerciseView> exercises
) {}

record RoutineExerciseView(
  int position,
  String exerciseCode,
  String displayName,
  String notes,
  List<RoutineSetView> sets
) {}

record RoutineSetView(
  int position,
  BigDecimal targetWeightKg,
  int targetRepetitions,
  String notes
) {}
