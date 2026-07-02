# C4 Level 1: System Context

## Purpose

Show Project_MT and its external actors/systems without implementation detail.

```mermaid
C4Context
  title Project_MT - System Context

  Person(user, "Fitness user", "Logs workouts, measurements, routines, and progress.")
  Person(owner, "Product/operations owner", "Manages product configuration and operational decisions.")

  System(projectmt, "Project_MT", "Visual-first workout and body-recomposition platform.")

  System_Ext(identity, "Identity provider", "Authenticates users through OIDC.")
  System_Ext(storage, "Object storage", "Stores private photos and reports.")
  System_Ext(email, "Email provider", "Sends verification and account messages.")
  System_Ext(observability, "Observability platform", "Receives errors, logs, metrics, and traces.")

  Rel(user, projectmt, "Uses", "HTTPS")
  Rel(owner, projectmt, "Configures and monitors", "HTTPS")
  Rel(projectmt, identity, "Authenticates through", "OIDC/OAuth 2.0")
  Rel(projectmt, storage, "Stores and retrieves private media", "HTTPS")
  Rel(projectmt, email, "Sends transactional email", "HTTPS")
  Rel(projectmt, observability, "Emits sanitized telemetry", "OTLP/HTTPS")
```

## Notes

- Community users are not separate actors until public social features are approved.
- The 3D model is an application capability, not an external clinical system.
- No medical or diagnostic system integration is implied.

