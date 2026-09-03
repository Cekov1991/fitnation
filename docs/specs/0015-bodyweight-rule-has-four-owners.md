# Bug: The bodyweight rule has four owners and they disagree about TRX

Status: needs-decision
Origin: monorepo depth review, 2026-09-03.
Scope: `apps/mobile`, `apps/web`, then `packages/shared`

## Problem Statement

Whether an exercise accepts a logged weight is decided in four places, by two
different rules:

| Location | Rule |
|---|---|
| `apps/mobile/.../ExercisePage.tsx:24,90` | `!['BODYWEIGHT','TRX'].includes(code)` |
| `apps/mobile/.../ExerciseDetailScreen.tsx:211` | `code !== 'BODYWEIGHT'` |
| `apps/mobile/.../WorkoutSessionExerciseDetailScreen.tsx:150` | `code !== 'BODYWEIGHT'` |
| `apps/web/.../workout-session/utils.ts:5` | `['BODYWEIGHT','TRX'] as const` |

So **TRX refuses a weight inside a live Workout Session and accepts one on the
exercise detail screens**. Same exercise, two behaviours, one app.

## Why this needs a decision

The disagreement is not a typo — it is two defensible product positions that were
never reconciled:

1. **TRX is bodyweight.** Suspension work is scaled by body angle, not added
   load, so a weight field is meaningless. This is what the session screens and
   web assume.
2. **TRX can carry load.** A weighted vest or belt is normal on TRX rows and
   dips. This is what the detail screens assume.

Whichever is chosen, note that `equipment_type.code` is a server-owned taxonomy,
so a third option is that this is not a client rule at all — the server could
expose a `supports_added_weight` flag per equipment type and no client would
decide anything. That is the most durable answer and the only one that survives
the next equipment type being added.

## Evidence

- the four sites above
- `packages/shared/src/units/index.ts` — the module that already owns
  "everything that follows from a Unit System", and does not own this
- no test covers any of the four sites

## Proposed change

Depends on the decision. In all three cases the rule ends up with one owner:

- **If client-side:** one predicate in `packages/shared`, taking an equipment
  type code and returning whether weight logging is allowed. All four sites call
  it. This is a prerequisite of 0023, which needs a single answer to fold into
  the Workout Session read model.
- **If server-side:** a `supports_added_weight` field on the equipment type
  resource, and the four client rules are deleted rather than unified. Needs a
  back-end issue.

## Out of scope

- what a bodyweight exercise stores in `weight` (currently `0`)
- the `progression_mode` distinction (`double_progression` vs `total_reps`),
  which is a separate axis and already server-owned

## Acceptance

- One place decides whether an exercise accepts a weight
- TRX behaves identically in the session and on both detail screens
- A test pins the decision for TRX specifically, since that is the case that
  drifted
