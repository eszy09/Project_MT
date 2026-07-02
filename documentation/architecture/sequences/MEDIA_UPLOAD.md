# Sequence: Private Media Upload

```mermaid
sequenceDiagram
  actor User
  participant Web as Next.js Web
  participant API as Spring Boot API
  participant Storage as Object Storage
  participant DB as PostgreSQL
  participant Worker as Media Worker

  User->>Web: Select approved image/report
  Web->>API: Request upload operation
  API->>API: Authorize, validate metadata and quota
  API->>DB: Create pending media record
  API-->>Web: Short-lived signed upload URL
  Web->>Storage: Upload directly
  Web->>API: Finalize upload
  API->>Storage: Verify object metadata
  API->>DB: Mark media ready
  API->>Worker: Request scan/processing
  Worker->>Storage: Scan/process object
  Worker->>DB: Store result
  API-->>Web: Media status
```

## Rules

- Objects are private by default.
- File extension alone is not trusted.
- Size, content type, and content are validated.
- Pending/failed objects are cleaned up.
- Deleting user media deletes the stored object and metadata according to retention policy.

