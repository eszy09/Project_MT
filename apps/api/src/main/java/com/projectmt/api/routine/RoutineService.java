package com.projectmt.api.routine;

import com.projectmt.api.auth.CurrentUserService;
import com.projectmt.api.shared.api.ApiConflictException;
import com.projectmt.api.shared.api.ApiResourceNotFoundException;
import java.util.List;
import java.util.UUID;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
class RoutineService {

  private final CurrentUserService users;
  private final RoutineRepository routines;

  RoutineService(CurrentUserService users, RoutineRepository routines) {
    this.users = users;
    this.routines = routines;
  }

  @Transactional
  RoutineView create(RoutineCommand command) {
    UUID userId = users.requireCurrentUser().id();
    RoutineCommand normalized = normalize(command);
    UUID id = routines.insert(userId, normalized);
    routines.replaceChildren(userId, id, normalized);
    return routines.find(userId, id).orElseThrow();
  }

  @Transactional(readOnly = true)
  List<RoutineView> list(boolean includeArchived) {
    return routines.list(users.requireCurrentUser().id(), includeArchived);
  }

  @Transactional(readOnly = true)
  RoutineView get(UUID id) {
    return routines.find(users.requireCurrentUser().id(), id)
      .orElseThrow(ApiResourceNotFoundException::new);
  }

  @Transactional
  RoutineView update(UUID id, int version, RoutineCommand command) {
    UUID userId = users.requireCurrentUser().id();
    RoutineCommand normalized = normalize(command);
    ensureExists(userId, id);
    if (!routines.update(userId, id, version, normalized)) {
      throw new ApiConflictException("The routine was modified by another request.");
    }
    routines.replaceChildren(userId, id, normalized);
    return routines.find(userId, id).orElseThrow();
  }

  @Transactional
  RoutineView archive(UUID id, int version, boolean archived) {
    UUID userId = users.requireCurrentUser().id();
    ensureExists(userId, id);
    if (!routines.setArchived(userId, id, version, archived)) {
      throw new ApiConflictException("The routine was modified by another request.");
    }
    return routines.find(userId, id).orElseThrow();
  }

  @Transactional
  void delete(UUID id) {
    UUID userId = users.requireCurrentUser().id();
    RoutineView routine = routines.find(userId, id)
      .orElseThrow(ApiResourceNotFoundException::new);
    if (routine.archivedAt() == null) {
      throw new ApiConflictException("Archive the routine before deleting it.");
    }
    routines.deleteArchived(userId, id);
  }

  private void ensureExists(UUID userId, UUID id) {
    if (routines.find(userId, id).isEmpty()) {
      throw new ApiResourceNotFoundException();
    }
  }

  private RoutineCommand normalize(RoutineCommand command) {
    return new RoutineCommand(
      command.name().strip(),
      text(command.description()),
      command.muscleGroup(),
      command.exercises().stream().map(exercise -> new RoutineExerciseCommand(
        exercise.exerciseCode().strip(),
        exercise.displayName().strip(),
        text(exercise.notes()),
        exercise.sets().stream().map(set -> new RoutineSetCommand(
          set.targetWeightKg() == null ? null : set.targetWeightKg().stripTrailingZeros(),
          set.targetRepetitions(),
          text(set.notes())
        )).toList()
      )).toList()
    );
  }

  private String text(String value) {
    if (value == null) return null;
    String normalized = value.strip();
    return normalized.isEmpty() ? null : normalized;
  }
}
