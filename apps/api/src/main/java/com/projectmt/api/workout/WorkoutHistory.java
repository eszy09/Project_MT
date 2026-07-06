package com.projectmt.api.workout;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.List;
import java.util.UUID;

record WorkoutHistoryFilter(
  int limit,
  WorkoutHistoryCursor cursor,
  String exerciseCode,
  Instant from,
  Instant to
) {}

record WorkoutHistoryCursor(Instant completedAt, UUID id) {}

record WorkoutHistoryPage(
  List<WorkoutHistoryItem> items,
  String nextCursor
) {}

record WorkoutHistoryItem(
  UUID id,
  Instant startedAt,
  Instant completedAt,
  long durationSeconds,
  String notes,
  int exerciseCount,
  int setCount,
  int completedSetCount,
  BigDecimal completedVolumeKg
) {}

record WorkoutDetail(
  UUID id,
  Instant startedAt,
  Instant completedAt,
  long durationSeconds,
  String notes,
  List<WorkoutExerciseDetail> exercises
) {}

record WorkoutExerciseDetail(
  int position,
  String exerciseCode,
  String displayName,
  String notes,
  List<WorkoutSetDetail> sets
) {}

record WorkoutSetDetail(
  int position,
  BigDecimal weightKg,
  int repetitions,
  Instant completedAt,
  String notes
) {}

record PreviousExercisePerformance(
  UUID workoutId,
  Instant completedAt,
  String exerciseCode,
  String displayName,
  List<WorkoutSetDetail> sets
) {}
