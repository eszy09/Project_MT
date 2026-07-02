# C4 Level 2: Container Diagram

```mermaid
C4Container
  title Project_MT - Containers

  Person(user, "Fitness user")

  System_Boundary(projectmt, "Project_MT") {
    Container(web, "Web application", "Next.js, React, TypeScript", "Responsive UI and 3D interaction.")
    Container(mobile, "Future mobile application", "Expo, React Native", "Native mobile experience.")
    Container(api, "Application API", "Java 21, Spring Boot", "Authentication, authorization, domain rules, and REST API.")
    Container(worker, "Background worker", "Spring Boot", "Processes slow or retryable work.")
    ContainerDb(db, "Application database", "PostgreSQL", "Stores structured user and product data.")
    ContainerDb(media, "Private media storage", "S3-compatible object storage", "Stores photos and reports.")
  }

  System_Ext(identity, "OIDC identity provider")
  System_Ext(observability, "Observability platform")

  Rel(user, web, "Uses", "HTTPS")
  Rel(user, mobile, "Uses", "HTTPS")
  Rel(web, api, "Calls", "REST/JSON over HTTPS")
  Rel(mobile, api, "Calls", "REST/JSON over HTTPS")
  Rel(api, identity, "Validates identity", "OIDC")
  Rel(api, db, "Reads and writes", "SQL/TLS")
  Rel(api, media, "Creates signed operations", "HTTPS")
  Rel(api, worker, "Dispatches asynchronous work", "Queue or database job")
  Rel(worker, db, "Reads and writes", "SQL/TLS")
  Rel(worker, media, "Processes media", "HTTPS")
  Rel(web, observability, "Emits frontend telemetry", "HTTPS")
  Rel(api, observability, "Emits backend telemetry", "OTLP/HTTPS")
```

## Container rules

- The web application never connects directly to PostgreSQL.
- The API and worker are stateless.
- Media bytes do not pass through the API when a signed direct upload is suitable.
- The worker may initially run inside the API deployment but must retain a clean boundary.

