# ADR-003: PostgreSQL as the Structured Data Store

- Status: Accepted
- Date: 2026-07-02

## Context

Workout sessions, exercises, sets, routines, measurements, users, and journals have strong relationships and require transactions, ownership checks, filtering, and analytics.

## Decision

Use PostgreSQL in local development, tests, staging, and production. Use Flyway for schema migrations.

## Consequences

### Positive

- Relational integrity and transactions.
- Strong indexing and analytical query support.
- Broad managed-provider availability.
- Lower environment drift.

### Negative

- Schema changes require migration discipline.
- Large analytics workloads may eventually need replicas or a separate analytical system.

## Guardrails

- Test migrations from an empty database.
- Index user/date and common history filters.
- Review query plans before adding caches.

