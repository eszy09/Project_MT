# Private media upload policy

## Scope

Media uploads are optional private objects such as progress photos and reports.
Project_MT does not publish, share, or index uploaded media.

## Consent and retention

- The API requires `consentAccepted = true` before creating a signed upload
  operation.
- Retention is `USER_CONTROLLED_DELETE`.
- Deleting a media asset removes its metadata from user-visible APIs and calls
  object storage deletion for the private object key.
- Account deletion cascades metadata through `app_users`; object-storage cleanup
  should be included in the account-deletion worker when that worker exists.

## Validation

The upload operation validates:

- file size: 1 byte through 10 MB by default;
- content type: `image/jpeg`, `image/png`, `image/webp`, or
  `application/pdf`;
- filename length and sanitization for storage-key safety.

## Storage privacy

Objects are addressed under a per-user key prefix and remain private by default.
The API returns short-lived signed `PUT` operations only. It does not expose raw
storage object keys in public API responses.

## Logging

Media filenames are returned to the authenticated owner but are not written by
feature code to structured logs. Request logging records route, method, status,
and timing only.
