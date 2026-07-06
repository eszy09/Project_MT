package com.projectmt.api.workout;

import com.projectmt.api.auth.CurrentUserService;
import com.projectmt.api.shared.api.ApiConflictException;
import com.projectmt.api.shared.api.ApiFieldError;
import com.projectmt.api.shared.api.ApiValidationException;
import java.math.BigDecimal;
import java.nio.ByteBuffer;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.time.Duration;
import java.time.Instant;
import java.util.ArrayList;
import java.util.HexFormat;
import java.util.List;
import java.util.UUID;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class WorkoutService {

  private static final Duration MAXIMUM_DURATION =
    Duration.ofDays(7);

  private final CurrentUserService currentUsers;
  private final WorkoutRepository workouts;

  public WorkoutService(
    CurrentUserService currentUsers,
    WorkoutRepository workouts
  ) {
    this.currentUsers = currentUsers;
    this.workouts = workouts;
  }

  @Transactional
  public WorkoutSaveResult saveCompletedWorkout(
    String completionKey,
    WorkoutCompletionCommand suppliedCommand
  ) {
    UUID userId = currentUsers.requireCurrentUser().id();
    WorkoutCompletionCommand command = normalize(suppliedCommand);

    validate(command);

    String requestFingerprint = fingerprint(command);
    var insertedSessionId = workouts.insertCompletedSession(
      userId,
      completionKey,
      requestFingerprint,
      command
    );

    if (insertedSessionId.isEmpty()) {
      StoredWorkout existing = workouts
        .findByCompletionKeyForUser(userId, completionKey)
        .orElseThrow(() -> new IllegalStateException(
          "Idempotent workout could not be loaded."
        ));

      if (!requestFingerprint.equals(existing.requestFingerprint())) {
        throw new ApiConflictException(
          "The idempotency key was already used for a different workout."
        );
      }

      return new WorkoutSaveResult(existing.workout(), true);
    }

    UUID sessionId = insertedSessionId.orElseThrow();

    for (
      int exerciseIndex = 0;
      exerciseIndex < command.exercises().size();
      exerciseIndex++
    ) {
      WorkoutExerciseCommand exercise = command
        .exercises()
        .get(exerciseIndex);
      UUID exerciseId = workouts.insertExercise(
        sessionId,
        userId,
        exerciseIndex + 1,
        exercise
      );

      for (
        int setIndex = 0;
        setIndex < exercise.sets().size();
        setIndex++
      ) {
        workouts.insertSet(
          exerciseId,
          sessionId,
          userId,
          setIndex + 1,
          exercise.sets().get(setIndex)
        );
      }
    }

    SavedWorkout savedWorkout = workouts
      .findByCompletionKeyForUser(userId, completionKey)
      .map(StoredWorkout::workout)
      .orElseThrow(() -> new IllegalStateException(
        "Saved workout could not be loaded."
      ));

    return new WorkoutSaveResult(savedWorkout, false);
  }

  private WorkoutCompletionCommand normalize(
    WorkoutCompletionCommand command
  ) {
    List<WorkoutExerciseCommand> exercises = command
      .exercises()
      .stream()
      .map(exercise ->
        new WorkoutExerciseCommand(
          exercise.exerciseCode().strip(),
          exercise.displayName().strip(),
          normalizeText(exercise.notes()),
          exercise
            .sets()
            .stream()
            .map(set ->
              new WorkoutSetCommand(
                set.weightKg().stripTrailingZeros(),
                set.repetitions(),
                set.completedAt(),
                normalizeText(set.notes())
              )
            )
            .toList()
        )
      )
      .toList();

    return new WorkoutCompletionCommand(
      command.startedAt(),
      command.completedAt(),
      normalizeText(command.notes()),
      exercises
    );
  }

  private String normalizeText(String value) {
    if (value == null) {
      return null;
    }

    String normalized = value.strip();
    return normalized.isEmpty() ? null : normalized;
  }

  private void validate(WorkoutCompletionCommand command) {
    List<ApiFieldError> errors = new ArrayList<>();
    Duration duration = Duration.between(
      command.startedAt(),
      command.completedAt()
    );

    if (duration.isNegative()) {
      errors.add(
        fieldError(
          "completedAt",
          "RANGE",
          "Completion time must not be before the start time."
        )
      );
    } else if (duration.compareTo(MAXIMUM_DURATION) > 0) {
      errors.add(
        fieldError(
          "completedAt",
          "RANGE",
          "A workout cannot exceed seven days."
        )
      );
    }

    int completedSetCount = 0;

    for (
      int exerciseIndex = 0;
      exerciseIndex < command.exercises().size();
      exerciseIndex++
    ) {
      WorkoutExerciseCommand exercise = command
        .exercises()
        .get(exerciseIndex);

      for (
        int setIndex = 0;
        setIndex < exercise.sets().size();
        setIndex++
      ) {
        Instant setCompletedAt = exercise
          .sets()
          .get(setIndex)
          .completedAt();

        if (setCompletedAt == null) {
          continue;
        }

        completedSetCount++;

        if (
          setCompletedAt.isBefore(command.startedAt())
          || setCompletedAt.isAfter(command.completedAt())
        ) {
          errors.add(
            fieldError(
              "exercises["
                + exerciseIndex
                + "].sets["
                + setIndex
                + "].completedAt",
              "RANGE",
              "Set completion time must be within the workout."
            )
          );
        }
      }
    }

    if (completedSetCount == 0) {
      errors.add(
        fieldError(
          "exercises",
          "REQUIRED",
          "At least one set must be completed."
        )
      );
    }

    if (!errors.isEmpty()) {
      throw new ApiValidationException(
        "The workout cannot be completed with the supplied values.",
        errors
      );
    }
  }

  private ApiFieldError fieldError(
    String field,
    String code,
    String message
  ) {
    return new ApiFieldError(field, code, message);
  }

  private String fingerprint(WorkoutCompletionCommand command) {
    try {
      MessageDigest digest = MessageDigest.getInstance("SHA-256");

      append(digest, command.startedAt().toString());
      append(digest, command.completedAt().toString());
      append(digest, command.notes());
      append(digest, command.exercises().size());

      for (WorkoutExerciseCommand exercise : command.exercises()) {
        append(digest, exercise.exerciseCode());
        append(digest, exercise.displayName());
        append(digest, exercise.notes());
        append(digest, exercise.sets().size());

        for (WorkoutSetCommand set : exercise.sets()) {
          append(digest, canonicalDecimal(set.weightKg()));
          append(digest, set.repetitions());
          append(
            digest,
            set.completedAt() == null
              ? null
              : set.completedAt().toString()
          );
          append(digest, set.notes());
        }
      }

      return HexFormat.of().formatHex(digest.digest());
    } catch (NoSuchAlgorithmException exception) {
      throw new IllegalStateException(
        "SHA-256 is not available.",
        exception
      );
    }
  }

  private String canonicalDecimal(BigDecimal value) {
    return value.stripTrailingZeros().toPlainString();
  }

  private void append(MessageDigest digest, int value) {
    digest.update(ByteBuffer.allocate(Integer.BYTES).putInt(value).array());
  }

  private void append(MessageDigest digest, String value) {
    if (value == null) {
      append(digest, -1);
      return;
    }

    byte[] bytes = value.getBytes(StandardCharsets.UTF_8);
    append(digest, bytes.length);
    digest.update(bytes);
  }
}
