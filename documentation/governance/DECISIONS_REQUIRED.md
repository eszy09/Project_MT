# Decisions Requiring Project-Owner Guidance

Do not make these decisions silently. Present options, tradeoffs, and a recommendation, then ask the project owner for guidance.

## Decisions required before application scaffolding

1. **Frontend framework**
   - Recommended: React + TypeScript + Vite
   - Alternatives: Vue, Svelte, or retained vanilla JavaScript

2. **Backend ownership**
   - Recommended: Spring Boot is the only backend
   - Decision: archive/remove the legacy Node API or retain it for a defined purpose

3. **Database**
   - Recommended: PostgreSQL for local/staging/production consistency
   - Alternative: SQLite locally and PostgreSQL remotely

4. **Authentication**
   - Recommended: secure HTTP-only session/refresh cookie design
   - Alternatives: bearer token design or external identity provider

5. **Repository visibility**
   - Private or public GitHub repository

## Decisions required before feature implementation

6. V1 screen scope
7. Preserve current design or redesign
8. Metric-only or metric and imperial units
9. Workout draft behavior
10. RPE/RIR and rest timer scope
11. Exercise catalog source
12. Goal-proximity formula and wording
13. 3D model variants, fidelity, and asset licensing
14. Private-only journal or moderated community
15. Photo/report uploads and retention

## Decisions required before deployment

16. Cloud provider
17. Hosting region
18. Monthly infrastructure budget
19. Expected user traffic
20. Domain name
21. Launch countries
22. Analytics and error-tracking providers
23. Privacy/legal review

## How guidance should be requested

Each request should contain:

- The exact decision
- Two or three viable options
- Cost and implementation impact
- Security/privacy impact
- Recommended choice and reasoning
- Deadline by which the choice blocks work

