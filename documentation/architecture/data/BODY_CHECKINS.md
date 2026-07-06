# Body check-ins and derived parameters

Body check-ins preserve the values and units supplied by the user. Derived body
parameters are stored separately and always reference the source check-in and
the algorithm version that produced them.

## Partial check-ins

At least one measurement is required. Every individual measurement is optional,
so a user can record only the values they measured that day. Missing values
produce `null` derived parameters; they are never replaced with invented
defaults.

## Supported units and plausible ranges

These ranges are product input-validation boundaries, not medical judgments.
Values at or outside a boundary may still warrant confirmation in a future UI.

| Measurement | Units | Accepted canonical range |
| --- | --- | --- |
| Weight | `kg`, `lb` | 20–635 kg |
| Body fat | percent | 2–75% |
| Chest | `cm`, `in` | 30–250 cm |
| Waist | `cm`, `in` | 30–250 cm |
| Hips | `cm`, `in` | 30–250 cm |
| Arm | `cm`, `in` | 10–100 cm |
| Thigh | `cm`, `in` | 15–150 cm |

The API validates converted canonical values while the database stores the raw
value and unit. Database constraints provide a wider final integrity boundary.

## Derivation version 1

`body-proportions-v1` calculates dimensionless display scales from available
circumference measurements. It is deterministic and null-safe. It is intended
only to drive an approximate visual model and must not be presented as a
clinical body scan.

Recalculation under a future algorithm creates another versioned derived record
instead of altering the source measurements.
