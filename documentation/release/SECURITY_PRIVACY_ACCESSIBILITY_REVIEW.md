# Security, Privacy, and Accessibility Release Review

This document is the evidence checklist for Project_MT production release readiness. It must be reviewed before a production deployment is approved.

## Threat model and authorization test review

| Area                    | Evidence required                                                                              | Current project evidence                                                                                                        |
| ----------------------- | ---------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------- |
| Authentication boundary | OIDC/JWT configuration is environment-driven and no test credentials are reused in production. | API auth config is environment-based; staging and production secrets are isolated through GitHub Environments.                  |
| Authorization boundary  | User-owned resources reject cross-user access.                                                 | API integration tests cover owner-scoped access for onboarding/profile, workouts, routines, progress, journal, and media flows. |
| Sensitive object access | Private media and journal entries are not exposed across accounts.                             | Journal CRUD and media upload tests assert owner scoping and private response shapes.                                           |
| Operational boundary    | Deployment providers receive images/configuration, not embedded secrets.                       | Container images use runtime environment variables and `.dockerignore` excludes env files.                                      |

Review action before release:

- Run the API quality job on the release candidate.
- Confirm authorization test coverage still passes.
- Confirm no production secret is committed, logged, or included in image layers.

## Dependency and container scan thresholds

Approved threshold:

- Dependency audit must have no high or critical vulnerabilities.
- Container image scans must have no high or critical vulnerabilities after fixed packages are available.
- Moderate findings require owner review before production if they affect authentication, authorization, file upload, cryptography, or request parsing.

Current automated evidence:

- CI `Web quality` runs formatting, linting, typechecking, tests, and production build.
- CI `API quality` runs Maven verification and OpenAPI generation.
- CI `Container images` builds API/web production images and scans them with Trivy at `HIGH,CRITICAL`.
- `Production Release Review` runs `npm audit --audit-level=high`.

## WCAG 2.2 AA critical-flow review

Critical flows to review manually and, where possible, with automated browser checks:

| Flow                            | WCAG 2.2 AA focus                                                          |
| ------------------------------- | -------------------------------------------------------------------------- |
| Sign in and auth error recovery | Keyboard navigation, visible focus, clear error text, no keyboard trap     |
| Onboarding                      | Labels, instructions, error messaging, focus order, reduced cognitive load |
| Active workout logging          | Keyboard-only operation, target size, status updates, form validation      |
| Progress and body model review  | Text alternatives, non-color indicators, zoom/reflow, motion sensitivity   |
| Journal and media flows         | Consent text, destructive action confirmation, accessible upload states    |

Release reviewer must record:

- Browser and assistive technology used.
- Failures found.
- Fix issue links or explicit accepted risk.

## Data export, deletion, consent, and retention verification

| Data area              | Export                                                       | Deletion                                                                | Consent/retention                                                                 |
| ---------------------- | ------------------------------------------------------------ | ----------------------------------------------------------------------- | --------------------------------------------------------------------------------- |
| Profile and onboarding | Must be included in account export before production launch. | Account deletion must remove or anonymize profile data.                 | Profile data is user-provided and retained until deletion.                        |
| Workouts and routines  | Must be included in account export before production launch. | User-owned records must cascade or be deleted through account deletion. | Retained until user deletion.                                                     |
| Body check-ins         | Must be included in account export before production launch. | User-owned records must be deleted on account deletion.                 | See body check-in policy.                                                         |
| Journal                | Must be included in account export before production launch. | Journal rows are user-owned and cascade on account deletion.            | Private by default.                                                               |
| Media                  | Export should include metadata and object references.        | Deletion removes metadata visibility and deletes the storage object.    | Explicit upload consent timestamp and user-controlled delete policy are required. |

Production release must not proceed until the project owner confirms whether account-level export/deletion is in scope for the release candidate or explicitly deferred.

## Backup restoration and incident procedure tests

Required evidence before production approval:

- Restore staging PostgreSQL from a backup into an isolated database.
- Verify Flyway history and application health against the restored database.
- Restore or verify access to staging object storage backup/versioning.
- Run an incident drill covering detection, owner notification, containment, recovery, and post-incident review.

Evidence references are required inputs to the `Production Release Review` workflow.

## Owner production approval

Owner approval is explicit and cannot be assumed from merged code.

Approval requires both:

1. GitHub Environment approval for the `production` environment.
2. Running the `Production Release Review` workflow with the exact approval statement documented in [Production release approval](PRODUCTION_RELEASE_APPROVAL.md).

Ask for owner guidance before accepting any high-risk exception, privacy deferral, or accessibility exception.
