# Database Migration Policy

Project_MT uses PostgreSQL and Flyway for all schema changes.

## Rules

- Every schema change must be represented by a versioned Flyway migration.
- Application code must never create or alter production tables at runtime.
- Applied migrations are immutable and must never be edited.
- Migration filenames follow `V<version>__<description>.sql`.
- Migrations must be reviewed with the application change that requires them.
- PostgreSQL is used in local development, automated tests, staging, and production.
- Flyway validation must remain enabled.
- Flyway clean must remain disabled outside disposable test databases.

## Forward fixes

When an applied migration is incorrect, create a new migration that moves the
database from the current state to the correct state.

For example:

```text
V1__create_users.sql
V2__correct_user_constraint.sql
```
