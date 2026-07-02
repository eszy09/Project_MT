# User Stories: Authentication and Onboarding

## US-AUTH-001: Create account (P0)

As a new user, I want to create an account so that my fitness history is private and persistent.

### Acceptance criteria

- Valid email and password are required.
- Password is never stored or logged in plain text.
- Duplicate accounts return a safe error.
- Successful registration establishes an authenticated session.
- The session follows the documented expiration/revocation policy.

## US-AUTH-002: Return to account (P0)

As a returning user, I want to sign in and recover my saved data.

### Acceptance criteria

- Valid credentials restore the correct account.
- Invalid credentials return a generic response.
- Data remains available after application restart.
- Another user cannot access the account's data.

## US-ONBOARD-001: Complete onboarding (P0)

As a new user, I want to set my goal and target areas so that the app can personalize its interface.

### Acceptance criteria

- Required and optional fields are distinguished.
- Progress survives safe back navigation.
- Sensitive fields explain why they are requested.
- Completion takes the user to a useful home state.

