# Persistent Onboarding Sequence

## Purpose

Onboarding captures enough information to personalize the first authenticated
home state without forcing a user to provide optional body measurements.

## Data classification

| Field | Requirement | Purpose |
|---|---|---|
| Display name | Required | Personalizes the private application interface |
| Primary goal | Required | Selects the initial training emphasis |
| Target areas | Required, one or more | Prioritizes relevant muscle groups |
| Experience level | Optional | Adjusts future guidance complexity |
| Height and weight | Optional, sensitive | Adds context to progress and future guidance |

Body measurements are private profile data. The interface explains their
purpose before collection, and the API never accepts a caller-supplied user ID.

## Save and resume flow

```mermaid
sequenceDiagram
    actor User
    participant Web as Next.js web
    participant IdP as Auth0
    participant API as Spring Boot API
    participant DB as PostgreSQL

    User->>Web: Open /dashboard
    Web->>IdP: Resolve encrypted session
    IdP-->>Web: Session and API access token
    Web->>API: GET /api/v1/profile/onboarding
    API->>API: Resolve user from verified JWT
    API->>DB: Find profile WHERE user_id = authenticated user

    alt No onboarding profile
        DB-->>API: No row
        API-->>Web: 404 RESOURCE_NOT_FOUND
        Web-->>User: Redirect to stage 1
    else Incomplete draft
        DB-->>API: Saved draft and available stage
        API-->>Web: Onboarding draft
        Web-->>User: Resume latest accepted stage
    else Completed onboarding
        DB-->>API: Completed profile
        API-->>Web: Completed profile
        Web-->>User: Personalized dashboard
    end

    loop Each accepted stage
        User->>Web: Submit stage
        Web->>API: PUT stage with bearer token
        API->>DB: Update profile using authenticated user_id
        DB-->>API: Persisted profile
        API-->>Web: Updated onboarding state
        Web-->>User: Show next stage
    end

    User->>Web: Complete setup
    Web->>API: POST /api/v1/profile/onboarding/complete
    API->>DB: Validate required data and set completed_at
    DB-->>API: Completed profile
    API-->>Web: Completed onboarding state
    Web-->>User: Redirect to personalized dashboard
```

## Persistence rules

- Stage 1 creates the profile if it does not exist.
- Later stages require the authenticated user's profile.
- `onboarding_step` only moves forward, so revisiting an earlier stage cannot
  erase accepted progress.
- Each stage updates only its own fields.
- Completion requires a primary goal and at least one target area.
- Every query derives ownership from the verified JWT identity.

## Guidance checkpoints

Ask the product owner for guidance before changing goal choices, target-area
taxonomy, required fields, measurement ranges, privacy wording, or completion
behavior. Those choices affect stored data, recommendations, and user trust.
