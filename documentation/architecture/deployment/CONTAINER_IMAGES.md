# Container Images

Project_MT production builds use portable OCI images so hosting providers can change without rewriting the application.

## Images

| Image | Dockerfile | Runtime | Exposed port | Health behavior |
| --- | --- | --- | --- | --- |
| Web | `apps/web/Dockerfile` | Next.js standalone on Node.js 24 Alpine | `3000` | `GET /api/health` returns `{ "status": "ok" }` |
| API | `apps/api/Dockerfile` | Spring Boot JAR on Temurin 21 JRE Alpine | `8080` | `GET /actuator/health/readiness` reports readiness |

## Runtime principles

- Containers run as non-root users.
- Images do not persist application data in the container filesystem.
- Durable state remains in PostgreSQL and object storage.
- Configuration is injected through environment variables.
- Web builds use Next.js `standalone` output to avoid shipping the full source tree.
- API builds use a packaged Spring Boot JAR and Actuator health probes.

## Local image commands

```powershell
docker build -f apps/api/Dockerfile -t project-mt-api:local .
docker build -f apps/web/Dockerfile -t project-mt-web:local .
```

Run containers with environment values supplied from the deployment platform or a local development environment file. Ask for guidance before changing runtime secrets, registry names, deployment targets, or provider-specific settings.

## CI scanning

CI builds both images and scans them with Trivy. High and critical findings fail the container image job so release candidates do not proceed with known severe image vulnerabilities.
