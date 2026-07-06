package com.projectmt.api.workout;

import com.projectmt.api.auth.CurrentUserService;
import com.projectmt.api.shared.api.ApiConflictException;
import com.projectmt.api.shared.api.ApiFieldError;
import com.projectmt.api.shared.api.ApiResourceNotFoundException;
import com.projectmt.api.shared.api.ApiValidationException;
import java.math.BigDecimal;
import java.nio.ByteBuffer;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.time.Duration;
import java.time.Instant;
import java.util.ArrayList;
import java.util.Base64;
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

  @Transactional(readOnly = true)
  public WorkoutHistoryPage history(
    int limit,
    String cursor,
    String exerciseCode,
    Instant from,
    Instant to
  ) {
    List<ApiFieldError> errors = new ArrayList<>();
    String normalizedExerciseCode = normalizeExerciseCode(
      exerciseCode,
      errors
    );
    WorkoutHistoryCursor decodedCursor = decodeCursor(cursor, errors);

    if (from != null && to != null && from.isAfter(to)) {
      errors.add(
        fieldError(
          "from",
          "RANGE",
          "The start of the date range must not be after the end."
        )
      );
    }
    if (!errors.isEmpty()) {
      throw new ApiValidationException(
        "Workout history filters are invalid.",
        errors
      );
    }

    UUID userId = currentUsers.requireCurrentUser().id();
    List<WorkoutHistoryItem> fetched = workouts.findHistory(
      userId,
      new WorkoutHistoryFilter(
        limit,
        decodedCursor,
        normalizedExerciseCode,
        from,
        to
      )
    );
    boolean hasMore = fetched.size() > limit;
    List<WorkoutHistoryItem> items = hasMore
      ? List.copyOf(fetched.subList(0, limit))
      : List.copyOf(fetched);
    String nextCursor = hasMore
      ? encodeCursor(items.getLast())
      : null;

    return new WorkoutHistoryPage(items, nextCursor);
  }

  @Transactional(readOnly = true)
  public WorkoutDetail detail(UUID workoutId) {
    UUID userId = currentUsers.requireCurrentUser().id();
    return workouts
      .findDetail(userId, workoutId)
      .orElseThrow(ApiResourceNotFoundException::new);
  }

  @Transactional(readOnly = true)
  public PreviousExercisePerformance previousPerformance(
    String exerciseCode
  ) {
    List<ApiFieldError> errors = new ArrayList<>();
    String normalized = normalizeExerciseCode(exerciseCode, errors);
    if (normalized == null) {
      errors.add(
        fieldError(
          "exerciseCode",
          "REQUIRED",
          "Exercise code is required."
        )
      );
    }

    if (!errors.isEmpty()) {
      throw new ApiValidationException(
        "The exercise identifier is invalid.",
        errors
      );
    }

    UUID userId = currentUsers.requireCurrentUser().id();
    return workouts
      .findPreviousPerformance(userId, normalized)
      .orElseThrow(ApiResourceNotFoundException::new);
  }

  private String normalizeExerciseCode(
    String exerciseCode,
    List<ApiFieldError> errors
  ) {
    if (exerciseCode == null || exerciseCode.isBlank()) {
      return null;
    }

    String normalized = exerciseCode.strip();
    if (
      normalized.length() > 100
      || !normalized.matches("[a-z0-9][a-z0-9._-]*")
    ) {
      errors.add(
        fieldError(
          "exerciseCode",
          "FORMAT",
          "Exercise code must be a lowercase canonical identifier."
        )
      );
    }
    return normalized;
  }

  private WorkoutHistoryCursor decodeCursor(
    String cursor,
    List<ApiFieldError> errors
  ) {
    if (cursor == null || cursor.isBlank()) {
      return null;
    }

    try {
      String decoded = new String(
        Base64.getUrlDecoder().decode(cursor),
        StandardCharsets.UTF_8
      );
      String[] components = decoded.split("\\|", -1);
      if (components.length != 2) {
        throw new IllegalArgumentException("Wrong cursor component count.");
      }
      return new WorkoutHistoryCursor(
        Instant.parse(components[0]),
        UUID.fromString(components[1])
      );
    } catch (IllegalArgumentException exception) {
      errors.add(
        fieldError(
          "cursor",
          "FORMAT",
          "Cursor is invalid or no longer supported."
        )
      );
      return null;
    }
  }

  private String encodeCursor(WorkoutHistoryItem item) {
    String value = item.completedAt() + "|" + item.id();
    return Base64
      .getUrlEncoder()
      .withoutPadding()
      .encodeToString(value.getBytes(StandardCharsets.UTF_8));
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
