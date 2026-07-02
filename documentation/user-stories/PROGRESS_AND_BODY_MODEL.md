# User Stories: Progress and Body Model

## US-PR-001: Save check-in (P0)

As a user, I want to record measurements so that I can track body changes.

### Acceptance criteria

- Units and valid ranges are clear.
- Optional missing values do not crash processing.
- Raw measurements persist.
- Another user cannot access them.

## US-PR-002: View trends (P1)

As a user, I want understandable trends so that I can see changes over time.

### Acceptance criteria

- Charts include units and date ranges.
- Sparse data produces an honest empty/limited state.
- Charts include accessible textual summaries.
- Trends do not claim medical causation.

## US-BM-001: View approximate body model (P1)

As a visual learner, I want my measurements reflected in a body model so that progress feels tangible.

### Acceptance criteria

- Derived parameters reference source measurements and algorithm version.
- The model is labeled as an approximation.
- Muscle selection is also available through accessible controls.
- The 3D model failure does not block workout logging.

## US-REC-001: Understand recommendation (P1)

As a user, I want to know why a training focus was suggested so that I can trust or reject it.

### Acceptance criteria

- The recommendation lists its important inputs.
- Missing data reduces confidence rather than inventing precision.
- The user can choose a different workout.
- Formula/logic changes are versioned.

