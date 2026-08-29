# Spec: RPE and to-failure capture

Status: needs-decision
Origin: workout session screen review, 2026-08-27. Deferred from `plans/stage-14-mobile-session-simplification.md`.
Scope: `back-end` (schema, API) then `packages/shared`, `apps/mobile`

## Problem Statement

A set records `weight`, `reps` and `rest_seconds`. Nothing records how hard it
was. Two sets of 8 × 80kg, one comfortable and one a grinding near-failure, are
indistinguishable in the data — to the user reading their history, and to the
progression engine deciding what to suggest next.

This is the largest of the deferred items and the only one that needs a
migration. It is also the one with the clearest payoff for the progression
logic, which currently infers effort from rep counts against a target range
alone.

## Evidence

- `back-end/database/migrations/2025_11_18_215134_create_workout_session_set_logs_table.php`
  — `workout_session_set_logs` is `set_number`, `weight` (decimal 8,2), `reps`,
  `rest_seconds`. No effort column.
- No `rpe` reference anywhere in `database/migrations` or `app/Models/SetLog.php`
- `src/components/workout-session/ProgressionBanner.tsx` — progression status is
  `no_history | below_min | working | ready`, derived from reps vs target range

## Why this needs a decision

The capture mechanism determines everything downstream, and the options differ
in cost by an order of magnitude:

1. **RPE 1–10** — the standard, most useful for progression, and the most
   friction: a second input on every set, which competes directly with the
   one-tap logging the session screen is being simplified toward (stage 14).
2. **RIR (reps in reserve), 0–4** — smaller scale, easier to answer honestly,
   maps cleanly onto double progression.
3. **A single "to failure" toggle** — near-zero friction, one boolean, captures
   the case that matters most for autoregulation while ignoring the gradient.
4. **Per-exercise rather than per-set** — one answer per exercise instead of one
   per set; much less tapping, much coarser data.

Options 1 and 2 are the same schema shape (a small nullable integer) and differ
only in UI and interpretation. Option 3 is a nullable boolean. Option 4 changes
which table the column lands on.

Whichever is chosen it must be **optional**. A required effort input on every set
would make the logging card slower for every user in order to serve the subset
who will use the data.

## Sequencing

This cannot be done front-end-first. Order:

1. decide the model above
2. back-end: migration, `SetLog` fillable/casts, `LogSetRequest` validation,
   `SetLogResource`, and a decision on whether the progression service consumes
   it yet
3. `packages/shared`: type, `LogSetInput`, `UpdateSetInput`
4. `apps/mobile`: input on `SetLogCard` and `SetEditCard`, display on
   `CompletedSetRow`, the summary and the exercise history chart
5. `apps/web`: parity

Existing rows will have nulls forever. Anything consuming the field — especially
the progression engine — has to treat null as "unknown", not as "easy".

## Out of scope

- changing progression logic to use the new signal. Capture first, decide
  separately whether and how it feeds `progression_status`; a column nobody reads
  is still worth having before a behaviour change nobody can evaluate.
- velocity or bar-speed capture

## Open questions

- RPE, RIR, to-failure toggle, or per-exercise?
- Per set or per exercise?
- Does the progression engine consume it in the same release, or later?
- Is it shown in history / charts, or captured silently for now?
