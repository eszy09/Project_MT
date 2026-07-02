# C4 Level 3: API Components

```mermaid
flowchart TB
  HTTP["REST controllers"]
  Security["Spring Security"]
  DTO["Request/response DTOs"]
  App["Application services"]
  Domain["Domain rules"]
  Ports["Repository/provider interfaces"]
  DB["PostgreSQL adapters"]
  Media["Object-storage adapter"]
  Identity["OIDC adapter"]
  Events["Post-commit events/jobs"]
  Errors["Error mapping"]
  Telemetry["Telemetry"]

  HTTP --> Security
  Security --> HTTP
  HTTP --> DTO
  DTO --> App
  App --> Domain
  App --> Ports
  Ports --> DB
  Ports --> Media
  Ports --> Identity
  App --> Events
  HTTP --> Errors
  App --> Telemetry
  DB --> Telemetry
```

## Request path

1. Security establishes the authenticated principal.
2. Controller maps the HTTP request into a validated DTO.
3. Application service coordinates the use case and transaction.
4. Domain rules enforce business invariants.
5. Repository/provider interfaces isolate infrastructure.
6. Exceptions become stable API error contracts.
7. Telemetry records safe operational context.

## Dependency direction

Domain logic must not depend on Spring MVC, PostgreSQL drivers, object-storage SDKs, or identity-provider SDKs.

