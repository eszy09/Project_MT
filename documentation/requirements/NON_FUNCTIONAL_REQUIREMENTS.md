# Non-Functional Requirements

Initial numeric targets require owner guidance and production measurement.

## Reliability

- Completed workout writes are atomic.
- Retried completion requests do not create duplicates.
- Active-workout recovery follows the approved draft policy.
- Backups and restore procedures are tested before production.

## Security

- HTTPS in non-local environments.
- Central authentication and query-level ownership enforcement.
- Private media by default.
- Secrets managed outside source control.
- Dependency and container scanning in CI.

## Privacy

- Data export and deletion.
- Explicit media consent and retention.
- Private-first journal behavior.
- Sensitive payloads excluded from logs.

## Performance

- Lazy-load the 3D feature.
- Use compressed GLB/glTF assets.
- Paginate history endpoints.
- Index common user/date and exercise-history queries.
- Establish Core Web Vitals and API latency budgets before launch.

## Accessibility

- Target WCAG 2.2 AA.
- Keyboard and screen-reader-compatible core flows.
- Non-canvas alternatives for muscle selection.
- Text alternatives for charts and visual progress.

## Operability

- Structured logs with request IDs.
- Health and readiness endpoints.
- Metrics for latency, errors, saturation, and critical use cases.
- Distributed traces across API and background work where useful.

## Maintainability

- Modular boundaries.
- OpenAPI-generated contracts.
- Versioned database migrations.
- Automated unit, integration, and end-to-end tests.
- Architecture and behavior documentation updated with code.

