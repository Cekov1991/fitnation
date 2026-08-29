# Spec: Set logs above target_sets are invisible

Status: needs-decision
Origin: workout session screen review, 2026-08-27. Deferred from `plans/stage-14-mobile-session-simplification.md`.
Scope: `apps/mobile` (web has the same slot model — see 0011)

## Problem Statement

`ExercisePage` renders exactly `targetSets` rows, numbered `1..targetSets`, and
fills each from `logged_sets` by matching `set_number`. Any logged set whose
`set_number` exceeds the current `target_sets` has no row to render into, so it
disappears from the screen while remaining in the database.

The user's work is still counted — the summary screen sums `logged_sets`
directly, so volume and set totals include the invisible rows — but the session
screen shows fewer sets than the user performed, and the count on the tab
disagrees with the summary they see at the end.

## How a set gets orphaned

`target_sets` is client-owned and freely decremented. Log 4 sets, then remove one
via the ⋯ menu on a *pending* row: `handleRemoveFromMenu` takes the
`activeSlot.kind === 'completed'` branch only when the row has a log, so for a
pending row it skips `deleteSet` and calls
`updateSessionExercise{ target_sets: targetSets - 1 }` alone. `target_sets` drops
to 3 while a log with `set_number = 4` remains.

The same shape is reachable from the preview screen's Edit Exercise modal, which
lets `target_sets` be set to any number including one below what has been logged
— though in practice preview precedes logging.

## Evidence

- `src/components/workout-session/ExercisePage.tsx` — `slots` is
  `Array.from({ length: targetSets })`, so the render is bounded by the target,
  not by the logs
- `src/components/workout-session/ExercisePage.tsx` — `handleRemoveFromMenu`
  deletes the log only for completed slots
- `src/screens/placeholders/WorkoutSummaryScreen.tsx` — `totalSets` sums
  `logged_sets.length`, unbounded by target. This is the disagreement.
- `back-end/app/Http/Controllers/Api/WorkoutSessionController.php:229-231` — the
  server re-sequences `set_number` on delete but deliberately does not touch
  `target_sets`: *"target_sets is owned by the client"*

Stage 14 makes the session screen and the nav tabs agree with each other via a
shared helper. It does **not** make either agree with the summary, because both
are bounded by target and the summary is not.

## Why this needs a decision

Two defensible models, and the fix differs entirely:

1. **Target is a floor, logs are truth.** Render `max(targetSets, highestLoggedSetNumber)`
   rows. Nothing is ever hidden; an orphan shows as a normal completed set and
   the user can remove it properly. Session screen then agrees with the summary.
2. **Target is authoritative.** Decrementing `target_sets` must delete the logs
   above it, so an orphan cannot exist. Destructive, and needs a confirmation
   the current ⋯ menu does not have — "Remove set 4? Its logged 60kg × 8 will be
   deleted."

Option 1 is the smaller change and loses no user data; it is the recommendation
unless there is a reason the target must cap the display.

Whichever is chosen, the pending-row branch in `handleRemoveFromMenu` should not
be able to strand a log.

## Out of scope

- who owns `target_sets` (client, per the server comment) — not revisiting
- the two-request removal sequence (see 0006)

## Acceptance

- Log 4 sets, remove a pending row, reduce target below 4 by any route → no
  logged set is unreachable from the session screen
- `totalSets` on the summary equals the number of completed rows the session
  screen showed
- If option 2: no confirmation-free path deletes a logged set

## Open questions

- Option 1 or option 2?
- If option 1, does an above-target row look different from an in-target one?
