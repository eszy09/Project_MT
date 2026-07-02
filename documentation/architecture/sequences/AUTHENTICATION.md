# Sequence: Authentication

```mermaid
sequenceDiagram
  actor User
  participant Web as Next.js Web
  participant API as Spring Boot API
  participant IdP as OIDC Provider
  participant DB as PostgreSQL

  User->>Web: Choose sign in
  Web->>API: Start authentication
  API-->>Web: Redirect/challenge details
  Web->>IdP: Authenticate
  IdP-->>API: Authorization response
  API->>IdP: Validate/exchange credentials
  API->>DB: Upsert identity mapping/session
  API-->>Web: Secure HTTP-only session
  Web->>API: GET /api/v1/me
  API->>DB: Load user by identity subject
  API-->>Web: Public user profile
  Web-->>User: Authenticated application
```

## Failure behavior

- Invalid or expired authentication returns a generic unauthorized response.
- Authentication errors never reveal secrets.
- Logout revokes the application session.
- Authorization and ownership checks still occur after successful authentication.

## Open decision

The exact OIDC provider requires owner guidance on budget, deployment region, and account-recovery requirements.

