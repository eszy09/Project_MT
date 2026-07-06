# Workout History Query Design

## API

- `GET /api/v1/workouts` returns completed-workout summaries.
- `GET /api/v1/workouts/{id}` reconstructs one owned workout in exercise and
  set order.
- `GET /api/v1/workouts/previous/{exerciseCode}` returns completed sets from
  the latest relevant completed session.

All queries derive the internal user from the authenticated principal. A
workout that is absent or owned by another user returns the same not-found
response.

## Pagination and filters

History uses an opaque cursor representing `(completed_at, id)` and orders both
columns descending. The UUID tie-breaker keeps pagination stable when sessions
share a completion timestamp.

- Default page size: 20
- Maximum page size: 50
- Filters: canonical exercise code, completion date from, completion date to
- Result status: completed workouts only

The client must treat `nextCursor` as opaque. Changing filters starts a new
cursor sequence.

## Previous performance

The latest relevant session is the newest completed workout containing at
least one completed set for the requested canonical exercise code. Only
completed sets are returned, and their original positions remain unchanged.

Copying a previous value modifies only the active browser draft. No history
mutation endpoint exists.

## Query and latency expectations

Initial targets, measured against a staging-like PostgreSQL dataset containing
at least 10,000 completed workouts for one user:

- history summary p95: less than 300 ms;
- previous-performance p95: less than 150 ms;
- detail reconstruction: three bounded database queries regardless of exercise
  count;
- no endpoint returns an unbounded collection;
- no per-row or per-exercise database query is permitted in history detail.

These are pre-launch engineering budgets, not production SLOs. Production SLOs
require owner guidance and observed traffic measurements.

## Indexes

- `(user_id, completed_at DESC, id DESC)` for stable history cursors;
- `(user_id, exercise_code, workout_session_id)` for owned exercise lookup;
- existing ownership foreign keys and unique constraints for detail joins.

Migration `V6__add_workout_history_cursor_index.sql` adds the cursor index.

## Verification

PostgreSQL integration tests cover pagination, filters, stable ordering,
ownership isolation, ordered reconstruction, latest relevant performance,
empty history, malformed cursors, and invalid date ranges.
