# Routine Persistence and Workout Snapshots

Routines are owned reusable templates stored in `routines`,
`routine_exercises`, and `routine_set_templates`. Composite foreign keys repeat
the owner and parent identifiers so cross-user relationships cannot be formed.

Exercises and set templates use one-based unique positions. Create and update
replace the complete ordered child hierarchy in one transaction. Updates use a
required version and reject stale writes with `409 Conflict`.

Archiving is reversible. Permanent deletion is accepted only for an archived
routine. Completed workout history has no cascading dependency on routines.

Starting a routine reads an owned routine and copies its ordered exercises and
set targets into a new browser-owned active-workout draft with new identifiers
and a new completion key. The draft is an independent snapshot: later edits,
archival, or deletion of the routine cannot change the active draft or
completed workout history.

Migration `V7__create_routine_schema.sql` introduces the schema and the
user/archive/update listing index.
