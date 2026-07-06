# User Stories: Workouts and Routines

## US-WO-001: Log a workout (P0)

As a strength-training user, I want to log every exercise and set so that I can measure progression.

### Acceptance criteria

- A completed workout has at least one exercise and valid set.
- Exercise and set order are preserved.
- Weight, repetitions, completion state, duration, and notes persist.
- Saving is transactional.
- A failed save preserves the user's draft.

## US-WO-002: Use previous values (P0)

As a returning user, I want to see my previous values so that I can choose today's load quickly.

### Acceptance criteria

- Previous values use the latest relevant completed session.
- Missing history has a clear empty state.
- Copying values does not alter historical data.

## US-WO-003: Recover active workout (P1)

As a user, I want an interrupted active workout to recover so that a crash or refresh does not lose my work.

### Acceptance criteria

- Recovery follows the approved
  [active-workout durability policy](../architecture/data/ACTIVE_WORKOUT_DURABILITY.md).
- Duplicate completion is prevented.
- The user can discard a recovered draft explicitly.

## US-RT-001: Create routine (P1)

As a user, I want a reusable ordered routine so that repeated workouts are faster to start.

### Acceptance criteria

- Routine name, muscle group, exercises, and set templates persist.
- A workout created from a routine is an independent snapshot.
- Editing a routine does not change workout history.

