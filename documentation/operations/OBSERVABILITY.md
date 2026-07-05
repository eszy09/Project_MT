# Observability and Request Correlation

## Purpose

Project_MT emits request-correlated, machine-readable telemetry without
collecting domain content or authentication credentials.

## Correlation contract

- Header: `X-Request-ID`
- Accepted format: 1-128 ASCII letters, numbers, `.`, `_`, or `-`
- A valid caller-provided ID is propagated.
- A missing or invalid ID is replaced with a UUID.
- The API returns the effective ID on every HTTP response.
- Next.js generates an ID for each server-to-API request and uses the returned
  ID when reporting a failure.

Request IDs are identifiers for operational correlation. They are not
authentication credentials and must never be used for authorization.

## Backend structured logs

Spring Boot writes Elastic Common Schema JSON to standard output. The request
filter adds the request ID to MDC and emits one completion event.

Example shape:

```json
{
  "service": { "name": "project-mt-api" },
  "message": "HTTP request completed",
  "request": { "id": "d7fe8c3a-37eb-4fe9-aef6-3c6d42f461c4" },
  "event": { "name": "http_request_completed" },
  "http": {
    "request": { "method": "GET" },
    "route": "/api/v1/profile/onboarding",
    "response": { "status_code": 200 },
    "outcome": "SUCCESS",
    "duration_ms": 12
  }
}
```

Only these request fields are logged:

- request ID
- HTTP method
- matched route template
- response status
- outcome class
- duration

Unexpected failures log the exception class, not its message or stack trace.

## Frontend failure logs

The Next.js server writes a small JSON event when an API request fails:

- service name
- event name
- request ID
- HTTP method
- route template
- status
- duration

When a server action can safely return the failure to the interface, the same
request ID is displayed as a support reference.

## Prohibited telemetry

The following values must not be logged, added as metric tags, or sent to a
telemetry provider:

- passwords or password-reset data
- session cookies, access tokens, ID tokens, or authorization headers
- request or response bodies
- query strings
- journal content or notes
- body measurements
- email addresses or identity-provider subjects
- database connection credentials

Do not add a new telemetry field without reviewing it against this list. Ask
the project owner for guidance if a proposed field can contain user-entered or
health-related data.

## Metrics

Spring Boot Actuator and Micrometer emit `http.server.requests`, including:

- request count
- total and maximum latency
- HTTP method
- matched route
- response status
- outcome

Prometheus format is available at:

```text
GET /actuator/prometheus
```

The endpoint is exposed but requires authentication while it shares the public
application port. A production deployment should place management endpoints on
a private network or management port before configuring a scraper.

## Local verification

Check request correlation:

```powershell
curl.exe -i `
  -H "X-Request-ID: local-observability-check" `
  http://localhost:8080/actuator/health
```

The response must include:

```text
X-Request-ID: local-observability-check
```

Prometheus scraping requires a valid API bearer token:

```powershell
curl.exe `
  -H "Authorization: Bearer <access-token>" `
  http://localhost:8080/actuator/prometheus
```

Never paste a real bearer token into documentation, source files, issue
comments, or committed shell scripts.

## Deferred production work

The deployment phase will decide:

- managed telemetry vendor
- OpenTelemetry tracing and `traceparent` propagation
- retention and deletion periods
- dashboards and alert thresholds
- private management endpoint networking
