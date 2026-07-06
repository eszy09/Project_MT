# Active Workout Draft Durability

## Status

Approved for the initial web application on 2026-07-06.

This policy covers interrupted active workouts. It does not define completed
workout history, which remains authoritative in PostgreSQL.

## Initial policy

- The web application stores at most one active workout draft per authenticated
  user and browser.
- Drafts use a versioned `localStorage` envelope.
- The storage namespace contains a server-derived SHA-256 hash of the identity
  provider subject. The raw subject, access tokens, and other credentials are
  never stored with the draft.
- Recoverable data includes the workout start time, completion idempotency key,
  notes, ordered exercises, ordered sets, values, and set completion times.
- API errors, request IDs, validation visibility, saving state, and completed
  response data are not persisted.
- A draft is updated after each meaningful workout state change and again when
  the page is hidden.
- Drafts expire after seven days. Expired, oversized, malformed, or incompatible
  envelopes are removed instead of being partially recovered.
- Opening the active-workout screen presents an explicit choice to resume or
  discard a recovered draft. Recovery never happens silently.
- Explicit discard and confirmed successful completion remove the local draft.
- Failed or interrupted completion preserves the draft and its existing
  idempotency key.

## Duplicate completion protection

The browser draft owns the completion idempotency key for its lifetime. A retry
submits the same key and payload to `POST /api/v1/workouts`.

The Spring Boot API and PostgreSQL remain the authority:

- the first matching request creates the completed workout;
- a matching replay returns the original workout;
- reuse of the same key with a different normalized payload returns a conflict.

This covers the failure where the database commits but the browser closes or
loses the HTTP response before clearing its draft.

## Privacy and security boundaries

Browser storage is accessible to JavaScript running on the same origin and is
therefore not a secret store. Content Security Policy, dependency review, output
escaping, and XSS prevention remain required controls.

The draft contains private training data but no authentication material. The
seven-day expiry limits retention on shared or abandoned browsers. Signing out
does not expose another user's draft because lookup is scoped by the
pseudonymous owner key.

## Future changes requiring owner guidance

Ask for project-owner guidance before:

- adding server-side or cross-device draft synchronization;
- changing retention duration;
- supporting multiple concurrent active drafts;
- encrypting browser drafts with a new key-management design;
- synchronizing drafts while offline;
- changing conflict or merge behavior between local and server drafts.

Those changes affect the API, database schema, privacy model, operational cost,
and user experience.

## Verification

Browser integration tests cover:

- persistence followed by component remount and explicit resume;
- explicit discard;
- user-key isolation;
- malformed and expired draft removal;
- retained idempotency keys across recovery and completion retry;
- exclusion of transient UI and error state.

Authenticated Playwright tests require a dedicated test identity and environment
strategy and should be introduced as a separate delivery item.
