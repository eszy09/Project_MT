package com.projectmt.api.workout;

import java.time.Instant;
import java.util.UUID;

record SavedWorkout(
  UUID id,
  WorkoutStatus status,
  Instant startedAt,
  Instant completedAt,
  long durationSeconds,
  String notes,
  int exerciseCount,
  int setCount,
  int completedSetCount,
  Instant createdAt
) {}

enum WorkoutStatus {
  COMPLETED
}

record StoredWorkout(
  SavedWorkout workout,
  String requestFingerprint
) {}

record WorkoutSaveResult(
  SavedWorkout workout,
  boolean replayed
) {}
