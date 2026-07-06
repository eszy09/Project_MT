package com.projectmt.api.workout;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.List;

record WorkoutCompletionCommand(
  Instant startedAt,
  Instant completedAt,
  String notes,
  List<WorkoutExerciseCommand> exercises
) {}

record WorkoutExerciseCommand(
  String exerciseCode,
  String displayName,
  String notes,
  List<WorkoutSetCommand> sets
) {}

record WorkoutSetCommand(
  BigDecimal weightKg,
  int repetitions,
  Instant completedAt,
  String notes
) {}
