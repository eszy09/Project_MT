# Body model accessibility contract

## Canonical region IDs

The interactive canvas and the non-canvas controls use the same canonical IDs:

| Canonical ID | GLB mesh | Primary view |
| --- | --- | --- |
| `head` | `region_head` | Front |
| `chest` | `region_chest` | Front |
| `back` | `region_back` | Back |
| `core` | `region_core` | Front |
| `left_arm` | `region_left_arm` | Front |
| `right_arm` | `region_right_arm` | Front |
| `left_leg` | `region_left_leg` | Front |
| `right_leg` | `region_right_leg` | Front |

`apps/web/src/features/body-model/body-model-regions.ts` is the source of truth
for labels, mesh names, default view, and user-facing summaries.

## Interaction rules

- Canvas mesh selection must call the same region-selection path as the list
  buttons.
- Front/back controls must be available outside the canvas.
- The list controls are the accessible equivalent for keyboard users, screen
  reader users, reduced-motion users, low-resource devices, and WebGL failure.
- The canvas is a progressive enhancement. It must not block workout logging or
  progress review.

## Reduced motion and failure behavior

Reduced-motion users receive the static view with the same region controls. If
the GLB, WebGL renderer, or dynamic import fails, the error boundary keeps the
static controls available and presents a retry option.
