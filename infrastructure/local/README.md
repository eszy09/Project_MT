# Local Infrastructure

This environment provides the production-like dependencies required for Project_MT development:

- PostgreSQL 18
- MinIO with an S3-compatible API
- Automatic creation of the private local media bucket
- Persistent named volumes
- Container health checks

It is for local development only. Production uses managed PostgreSQL and private object storage.

## Prerequisites

- Docker Desktop with Docker Compose v2
- PowerShell 7+ on Windows, or a POSIX shell on macOS/Linux
- Ports `5432`, `9000`, and `9001` available

## First start

From the repository root:

```powershell
Copy-Item .env.example .env
./scripts/dev-services.ps1 start
```

On macOS/Linux:

```bash
cp .env.example .env
./scripts/dev-services.sh start
```

The scripts create `.env` from `.env.example` when it is missing. Review local credentials before sharing a development environment.

## Endpoints

| Service | Address | Purpose |
|---|---|---|
| PostgreSQL | `localhost:5432` | Application database |
| MinIO S3 API | `http://localhost:9000` | Application object-storage endpoint |
| MinIO console | `http://localhost:9001` | Local object-storage administration |

Default local database:

```text
Database: project_mt
Username: project_mt
Password: local-development-only
```

Default MinIO console:

```text
Username: project_mt_minio
Password: local-development-only
Bucket: project-mt-local
```

These credentials are intentionally limited to local development and must never be reused in staging or production.

## Lifecycle commands

PowerShell:

```powershell
./scripts/dev-services.ps1 start
./scripts/dev-services.ps1 status
./scripts/dev-services.ps1 logs
./scripts/dev-services.ps1 stop
```

macOS/Linux:

```bash
./scripts/dev-services.sh start
./scripts/dev-services.sh status
./scripts/dev-services.sh logs
./scripts/dev-services.sh stop
```

## Health verification

```powershell
docker compose --env-file .env ps
docker compose --env-file .env exec postgres `
  pg_isready -U project_mt -d project_mt
```

The `postgres` and `object-storage` services should report `healthy`. The one-time `object-storage-init` container should exit with code `0`.

## Reset local data

Reset permanently deletes the local PostgreSQL and object-storage volumes.

PowerShell:

```powershell
./scripts/dev-services.ps1 reset
```

Skip the confirmation only in disposable automation:

```powershell
./scripts/dev-services.ps1 reset -Force
```

macOS/Linux:

```bash
./scripts/dev-services.sh reset
```

## Schema ownership

Do not add application tables through container initialization scripts. Flyway migrations introduced by issue `DB-001` own the application schema.

## Troubleshooting

### Port already in use

Change the corresponding port in `.env`, then restart the services.

### Changed credentials are ignored

PostgreSQL and MinIO initialize credentials in persistent volumes. For disposable local data, run the reset command and start again.

### Service is unhealthy

```powershell
docker compose --env-file .env logs postgres
docker compose --env-file .env logs object-storage
```

