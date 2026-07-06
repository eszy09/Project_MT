# Sequence: Workout Lifecycle

## Save completed workout

```mermaid
sequenceDiagram
  actor User
  participant Web as Next.js Web
  participant API as Spring Boot API
  participant DB as PostgreSQL
  participant Jobs as Post-commit Jobs

  User->>Web: Complete workout
  Web->>Web: Validate immediate input
  Web->>API: POST /api/v1/workouts + Idempotency-Key
  API->>API: Authenticate and validate ownership/input
  API->>DB: BEGIN
  API->>DB: Insert workout session
  loop Every exercise
    API->>DB: Insert ordered exercise
    loop Every set
      API->>DB: Insert ordered set
    end
  end
  API->>DB: COMMIT
  API->>Jobs: Publish workout-completed event
  API-->>Web: 201 Created + saved workout
  Web-->>User: Completion summary
```

## Idempotent retry

```mermaid
sequenceDiagram
  participant Web
  participant API
  participant DB as PostgreSQL

  Web->>API: POST workout + Idempotency-Key
  API->>DB: Insert completed session
  DB-->>API: Existing user/key conflict
  API->>DB: Read stored fingerprint and workout
  alt Fingerprint matches
    API-->>Web: 200 OK + original workout
  else Fingerprint differs
    API-->>Web: 409 Conflict
  end
```

The key is scoped to the authenticated internal user. A retry with the same
normalized payload returns the original representation. Reusing the key for a
different payload is rejected.

## Failure behavior

```mermaid
sequenceDiagram
  participant Web
  participant API
  participant DB

  Web->>API: Save workout
  API->>DB: BEGIN
  API->>DB: Write session/exercises/sets
  DB-->>API: Constraint or connection failure
  API->>DB: ROLLBACK
  API-->>Web: Stable error + request ID
  Web->>Web: Preserve draft and allow retry
```

## Invariants

- No partial completed workout is persisted.
- Idempotency prevents duplicate completion if a retry repeats the same request.
- Completed volume excludes incomplete sets.
- Historical ordering is preserved.

