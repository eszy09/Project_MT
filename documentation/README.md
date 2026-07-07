# Project_MT Documentation

This directory is the documentation source of truth for Project_MT.

## Start here

1. [Product overview](product/PRODUCT_OVERVIEW.md)
2. [Architecture index](architecture/README.md)
3. [Implementation plan](delivery/IMPLEMENTATION_PLAN.md)
4. [Decisions requiring guidance](governance/DECISIONS_REQUIRED.md)
5. [Complete build guide](reference/COMPLETE_BUILD_GUIDE.md)
6. [Security, privacy, and accessibility release review](release/SECURITY_PRIVACY_ACCESSIBILITY_REVIEW.md)

## Documentation map

```text
documentation/
|-- README.md
|-- product/
|   `-- PRODUCT_OVERVIEW.md
|-- architecture/
|   |-- README.md
|   |-- SYSTEM_ARCHITECTURE.md
|   |-- c4/
|   |-- sequences/
|   |-- deployment/
|   `-- decisions/
|-- user-stories/
|-- requirements/
|-- delivery/
|   `-- IMPLEMENTATION_PLAN.md
|-- governance/
|   `-- DECISIONS_REQUIRED.md
|-- operations/
|   `-- GITHUB_WORKFLOW.md
|-- release/
|   |-- SECURITY_PRIVACY_ACCESSIBILITY_REVIEW.md
|   `-- PRODUCTION_RELEASE_APPROVAL.md
`-- reference/
    `-- COMPLETE_BUILD_GUIDE.md
```

## Chosen baseline

- Web: Next.js, React, TypeScript
- 3D: Three.js through React Three Fiber
- API: Java 21 and Spring Boot
- Architecture: modular monolith
- Database: PostgreSQL
- Migrations: Flyway
- Contract: REST and OpenAPI
- Media: S3-compatible object storage
- Mobile later: Expo and React Native

The application stack remains stable from development through production. Deployment evolves from local processes to managed services and then autoscaled infrastructure.

## Collaboration rule

Ask the project owner for guidance when a decision:

- Changes product scope
- Affects privacy, security, or health-related wording
- Adds external cost
- Introduces vendor lock-in
- Changes a documented architecture decision
- Has multiple materially different user experiences

Present options, consequences, and a recommendation before implementing consequential decisions.

## Maintenance rule

Update documentation in the same pull request as the behavior or architecture change. Supersede architecture decision records; do not rewrite their history.
