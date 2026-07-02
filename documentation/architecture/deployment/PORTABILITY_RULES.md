# Deployment Portability Rules

These rules keep transitions between local, staging, production, and scale manageable.

## Mandatory rules

1. Package the API as a Docker image.
2. Keep a standalone/container deployment path for Next.js.
3. Keep API containers stateless.
4. Use PostgreSQL in every environment.
5. Version schema changes with Flyway.
6. Store media outside containers.
7. Read configuration from environment/secret providers.
8. Hide external providers behind application interfaces.
9. Keep core business logic out of platform-specific functions.
10. Emit vendor-neutral OpenTelemetry where practical.
11. Make background work idempotent.
12. Use stable public identifiers rather than provider-specific identity IDs as domain keys.

## Provider boundaries

Create interfaces for:

- Identity
- Email
- Media storage
- Notifications
- Analytics
- Background jobs

## Avoid

- Local uploaded files
- In-memory production sessions
- Hard-coded service URLs
- Provider-specific database features without an ADR
- Vercel-only business logic
- Unversioned manual schema changes
- Assuming one API instance

## Expected transition difficulty

| Transition | Relative difficulty | Main risk |
|---|---:|---|
| Local to staging | Low | Configuration and CI |
| Staging to production | Medium | Networking, secrets, recovery |
| Managed PostgreSQL to RDS | Medium | Data transfer and downtime |
| Vercel to containerized Next.js | Medium | Platform-specific features |
| Object-storage provider change | Low | Bulk object transfer |
| Identity-provider change | High | Account and session migration |
| Production to high scale | Medium-high | Operational complexity |

