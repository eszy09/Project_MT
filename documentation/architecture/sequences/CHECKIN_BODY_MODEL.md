# Sequence: Check-in and Body Model

```mermaid
sequenceDiagram
  actor User
  participant Web as Next.js Web
  participant API as Spring Boot API
  participant DB as PostgreSQL
  participant Model as Body Model Service

  User->>Web: Enter measurements
  Web->>API: POST /api/v1/checkins
  API->>API: Validate units and plausible ranges
  API->>DB: Save raw measurement
  API->>Model: Derive parameters(measurement, algorithmVersion)
  Model-->>API: Approximation parameters
  API->>DB: Save parameters and source reference
  API-->>Web: Check-in + model parameters
  Web->>Web: Apply parameters to GLB model
  Web-->>User: Updated trends and approximate model
```

## Rules

- Raw measurements are retained independently from derived values.
- Missing optional values are handled explicitly.
- The algorithm version is stored.
- Recalculation creates traceable derived output.
- The UI labels the model as an approximation, not a clinical scan.

