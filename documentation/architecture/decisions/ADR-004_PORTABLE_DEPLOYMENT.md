# ADR-004: Portable Managed Deployment Progression

- Status: Accepted
- Date: 2026-07-02

## Context

The project needs a low-friction start while retaining a credible path to production and scale.

## Decision

Use this progression:

1. Local Next.js, Spring Boot, and Docker PostgreSQL.
2. Vercel web, managed API container, and managed PostgreSQL for staging.
3. Containerized API on AWS ECS, RDS PostgreSQL, and S3 for production.
4. Add autoscaling, Redis, queues, workers, and replicas only when measured.

## Consequences

### Positive

- Fast early delivery.
- No planned application-stack rewrite.
- Infrastructure cost grows with product maturity.

### Negative

- Production introduces cloud/networking expertise.
- Cross-provider staging and production can expose differences.
- Identity migration remains expensive if providers change.

## Guardrails

- Follow `deployment/PORTABILITY_RULES.md`.
- Use Infrastructure as Code before production.
- Keep business logic independent of hosting providers.

