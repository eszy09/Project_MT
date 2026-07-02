# C4 Level 3: Web Components

```mermaid
flowchart TB
  Router["Next.js App Router"]
  Layout["Application layout"]
  Auth["Auth feature"]
  Workout["Workout feature"]
  Routine["Routine feature"]
  Progress["Progress feature"]
  Body["3D body-model feature"]
  Journal["Journal feature"]
  API["Typed API client"]
  Query["Server-state cache"]
  Draft["Draft state"]
  Telemetry["Frontend telemetry"]

  Router --> Layout
  Layout --> Auth
  Layout --> Workout
  Layout --> Routine
  Layout --> Progress
  Layout --> Body
  Layout --> Journal

  Auth --> API
  Workout --> API
  Routine --> API
  Progress --> API
  Journal --> API

  Workout --> Draft
  Workout --> Query
  Routine --> Query
  Progress --> Query
  Body --> Query
  API --> Query

  Layout --> Telemetry
  API --> Telemetry
```

## Component rules

- Feature modules do not call `fetch` directly; they use the typed API client.
- Server state is not duplicated into a general global store.
- Draft state is separate from persisted workout history.
- Three.js code loads only on routes/components that need it.
- Accessible muscle controls exist independently of the canvas.
- API-generated types are not edited manually.

