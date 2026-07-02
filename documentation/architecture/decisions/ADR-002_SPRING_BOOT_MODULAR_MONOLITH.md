# ADR-002: Spring Boot Modular Monolith

- Status: Accepted
- Date: 2026-07-02

## Context

The product requires transactional workout writes, authorization, validation, relational queries, and future background processing. The existing implementation already uses Spring Boot.

## Decision

Use Java 21 and Spring Boot as one deployable modular monolith.

## Consequences

### Positive

- Strong transaction, security, validation, and testing ecosystem.
- Lower operational complexity than microservices.
- Modules can later be extracted using established boundaries.

### Negative

- Java and TypeScript skills are both required.
- Poor module discipline could create a tightly coupled monolith.

## Guardrails

- Modules own use cases and persistence boundaries.
- Cross-module access occurs through explicit interfaces.
- No microservice extraction without measured need and a new ADR.

