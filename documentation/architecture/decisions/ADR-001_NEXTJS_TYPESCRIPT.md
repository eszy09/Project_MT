# ADR-001: Next.js and TypeScript for the Web Application

- Status: Accepted
- Date: 2026-07-02

## Context

Project_MT needs a responsive authenticated application, public product pages, complex workout forms, charts, and client-side 3D interaction.

## Decision

Use Next.js, React, and TypeScript. Run Three.js through React Three Fiber in client-only feature boundaries.

## Consequences

### Positive

- Strong component and TypeScript ecosystem.
- Supports public rendering and interactive application routes.
- Clear later path to React Native knowledge sharing.
- Mature testing and deployment tooling.

### Negative

- Server/client component boundaries require discipline.
- 3D components need careful bundle and runtime management.
- Vercel-specific features can create lock-in.

## Guardrails

- Core business rules stay in Spring Boot.
- Keep a container deployment path.
- Lazy-load 3D code and compressed GLB assets.

