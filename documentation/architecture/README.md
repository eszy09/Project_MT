# Architecture Index

## Core documents

- [System architecture](SYSTEM_ARCHITECTURE.md)
- [Portability rules](deployment/PORTABILITY_RULES.md)

## C4 model

- [Level 1: System context](c4/01_SYSTEM_CONTEXT.md)
- [Level 2: Containers](c4/02_CONTAINER_DIAGRAM.md)
- [Level 3: Web components](c4/03_WEB_COMPONENTS.md)
- [Level 3: API components](c4/04_API_COMPONENTS.md)

## Sequence diagrams

- [Authentication](sequences/AUTHENTICATION.md)
- [Workout lifecycle](sequences/WORKOUT_LIFECYCLE.md)
- [Check-in and body model](sequences/CHECKIN_BODY_MODEL.md)
- [Body check-in data policy](data/BODY_CHECKINS.md)
- [Body model asset pipeline](data/BODY_MODEL_ASSET_PIPELINE.md)
- [Body model accessibility contract](data/BODY_MODEL_ACCESSIBILITY.md)
- [Private journal data policy](data/JOURNAL_PRIVACY.md)
- [Private media upload policy](data/MEDIA_UPLOAD_POLICY.md)
- [Media upload](sequences/MEDIA_UPLOAD.md)

## Data model

- [Workout persistence schema](data/WORKOUT_SCHEMA.md)

## Deployment stages

- [Local development](deployment/01_LOCAL.md)
- [Early staging](deployment/02_STAGING.md)
- [Production](deployment/03_PRODUCTION.md)
- [Scaling](deployment/04_SCALING.md)
- [Container images](deployment/CONTAINER_IMAGES.md)

## Architecture decisions

- [ADR-001: Next.js and TypeScript](decisions/ADR-001_NEXTJS_TYPESCRIPT.md)
- [ADR-002: Spring Boot modular monolith](decisions/ADR-002_SPRING_BOOT_MODULAR_MONOLITH.md)
- [ADR-003: PostgreSQL](decisions/ADR-003_POSTGRESQL.md)
- [ADR-004: Portable managed deployment](decisions/ADR-004_PORTABLE_DEPLOYMENT.md)

## Diagram conventions

- C4 diagrams describe static structure.
- Sequence diagrams describe runtime interactions.
- Deployment documents describe environment-specific infrastructure.
- ADRs explain why a consequential decision was made.

Mermaid is used so diagrams render in GitHub and remain editable as text. Structurizr DSL may later become the canonical C4 source if automated architecture validation is required.

