# Project_MT Implementation Plan

## Delivery approach

Build the system in vertical slices. Each phase must leave the application testable and must not depend on memory-only production data.

Before starting work that changes product scope, privacy behavior, infrastructure cost, or core architecture, review `docs/DECISIONS_REQUIRED.md` and ask the project owner for guidance.

## Phase 0: Decisions and repository foundation

### Objectives

- Confirm V1 product scope.
- Confirm frontend framework.
- Confirm Spring Boot as the only backend.
- Confirm PostgreSQL, authentication strategy, hosting, units, and community scope.
- Establish GitHub repository rules and CI.

### Work

- Create the GitHub repository.
- Protect `main`.
- Add issue and pull-request templates.
- Add CODEOWNERS when collaborators are known.
- Configure Dependabot and secret scanning.
- Scaffold `apps/web` and `apps/api`.
- Add formatting, linting, and test commands.
- Add a local PostgreSQL development environment.

### Exit criteria

- Repository is connected to GitHub.
- A clean checkout can run all checks.
- Required owner decisions are documented.
- CI runs for every pull request.

## Phase 1: Durable identity and API foundation

### Objectives

- Remove the current restart-related data loss.
- Establish stable API and database conventions.

### Backend work

- Add Flyway migrations.
- Add `users` and `auth_sessions`.
- Implement password hashing, expiring sessions, logout, and revocation.
- Centralize authentication with Spring Security.
- Add standard API errors and request IDs.
- Add OpenAPI documentation.
- Add user ownership checks at query level.
- Add Testcontainers integration tests.

### Frontend work

- Create the application shell and router.
- Implement a typed API client.
- Build sign-up, sign-in, sign-out, and expired-session states.
- Build resumable onboarding.

### Exit criteria

- Identity survives restart.
- User A cannot read or change User B data.
- Authentication tests cover success and failure cases.
- API contracts are documented.

## Phase 2: Workout logging engine

### Objectives

- Make workout logging fast, complete, and loss-resistant.

### Backend work

- Persist workout sessions, exercises, and sets.
- Persist duration, notes, status, timestamps, and ordering.
- Support draft and completed states after owner approval.
- Add history filters and pagination.
- Calculate planned and completed volume separately.

### Frontend work

- Create active workout screen.
- Add/remove/reorder exercises.
- Add/remove/edit/complete sets.
- Show previous load and repetitions.
- Copy a previous session.
- Protect unsaved changes.
- Provide mobile-first controls and keyboard accessibility.

### Exit criteria

- A multi-exercise workout can be saved and reconstructed exactly.
- Refresh/navigation follows the approved draft policy.
- History and comparison use persisted data.
- End-to-end workout tests pass.

## Phase 3: Routines

### Objectives

- Allow repeatable training plans.

### Work

- Implement routine create/read/update/archive/delete.
- Support ordered exercises and set templates.
- Start an active workout from a routine.
- Keep a routine unchanged when a generated workout is edited.
- Add routine ownership and validation tests.

### Exit criteria

- Users can manage routines and start workouts from them.
- Routine edits never change historical workouts.

## Phase 4: Progress and body model

### Objectives

- Turn reliable history into understandable progress.

### Work

- Persist measurements and derived model parameters.
- Safely support missing optional measurements.
- Version the body-model algorithm.
- Add weight, circumference, volume, and consistency trends.
- Add accessible summaries for charts and the 3D model.
- Implement the owner-approved goal-proximity formula.
- Explain recommendation reasons.

### Exit criteria

- Sparse and complete histories render safely.
- Every score and recommendation has an explanation.
- The body model is clearly labeled as an approximation.

## Phase 5: Journal and supporting logs

### Objectives

- Add reflection and recovery context without weakening privacy.

### Work

- Implement private journal CRUD.
- Add nutrition, recovery, activity, and body-composition logs.
- Add secure object storage for approved images/reports.
- Add data export and deletion.
- Do not enable public posts without the approved moderation plan.

### Exit criteria

- Private content is access-controlled.
- Uploaded files can be deleted and follow retention rules.
- Privacy tests pass.

## Phase 6: Production readiness

### Work

- Add staging and production deployment workflows.
- Complete security and accessibility reviews.
- Add structured logs, metrics, health checks, and alerts.
- Add backup and restore procedures.
- Add performance budgets.
- Add privacy policy, terms, and health disclaimers.
- Conduct a release-candidate test.

### Exit criteria

- CI/CD is reproducible.
- Rollback and restore procedures are tested.
- No open critical/high security defects remain.
- The project owner explicitly approves release.

## Proposed sprint sequence

| Sprint | Primary outcome |
|---|---|
| 1 | Repository, CI, architecture decisions |
| 2 | Durable authentication and users |
| 3 | Frontend shell and onboarding |
| 4 | Set-by-set workout persistence |
| 5 | Complete workout logging UX |
| 6 | Routines and workout history |
| 7 | Check-ins and progress trends |
| 8 | 3D model and explainable score |
| 9 | Private journal and supporting logs |
| 10 | Security, accessibility, staging release |

Calendar estimates require team size, availability, and deadline. Ask the project owner for guidance before converting sprint order into dates.

## Definition of done

A feature is complete only when:

- Acceptance criteria pass.
- Server validation and authorization exist.
- Data persists correctly.
- Loading, empty, error, and success states exist.
- Automated tests cover core behavior.
- Accessibility has been checked.
- No secrets or sensitive payloads are logged.
- API and product documentation are updated.
- Required owner guidance was obtained.

