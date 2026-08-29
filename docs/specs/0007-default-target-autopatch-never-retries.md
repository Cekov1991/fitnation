# Spec: The default-target auto-patch never clears or retries

Status: ready-for-agent
Origin: workout session screen review, 2026-08-27. Deferred from `plans/stage-14-mobile-session-simplification.md`.
Scope: `apps/mobile`

## Problem Statement

When a session exercise arrives with null targets, `ExercisePage` renders sane
defaults (3 sets, 8–12 reps) and fires a background `updateSessionExercise` to
persist them. A module-level `Set` guards against re-firing:

```ts
// Tracks which session_exercise ids have had a background default-patch attempted
// this app session, so PagerView remounts don't re-fire it.
const autoFixedSessionExerciseIds = new Set<number>()
```

Two problems with the guard.

**It records attempts, not successes.** The id is added before the mutation
resolves and never removed. If the patch fails — offline, 500 — it is never
retried for the rest of the app's lifetime. The UI keeps showing 3×8-12 from the
local fallback while the server still holds nulls, so the numbers are honest to
the user and a lie about persisted state. Next launch, the same exercise silently
falls back again.

**It is unbounded and app-lifetime-scoped.** Module-level, so it survives screen
unmounts, logouts and user switches. It only ever grows.

## Why stage 14 makes this more load-bearing, not less

The comment attributes the need to "PagerView remounts". Stage 14 removes
`PagerView` — but it also renders one exercise at a time, so `ExercisePage`
remounts on **every** tab switch rather than only when a pager page recycles.
The guard goes from occasionally useful to the only thing preventing a repeated
PATCH each time the user flips between two exercises.

Do not delete it as pager cleanup. Fix what it tracks.

## Evidence

- `src/components/workout-session/ExercisePage.tsx` — `autoFixedSessionExerciseIds`
  declaration and the effect keyed on `[hasMissingTargets, session_exercise.id]`
- `hasMissingTargets` is `!target_sets || (!min_target_reps && !max_target_reps)`
  — note the asymmetry: a row with only `min_target_reps` set is not considered
  missing, but `maxReps` then falls back to 12 without ever being persisted

## Proposed change

- Add the id **on success**, not on call. Track in-flight ids separately so a
  remount mid-request does not double-fire.
- On failure, leave the id untracked so a later remount retries, and do not
  toast — this is a background repair the user did not ask for and cannot act on.
- Move the state out of module scope into a ref owned by the session screen (or a
  small `useDefaultTargetRepair` hook), so it is scoped to the session rather
  than the app process.
- Fix the `hasMissingTargets` asymmetry: treat a missing `max_target_reps` as
  missing even when `min_target_reps` is present, since `maxReps` is defaulted
  either way.

## Worth questioning separately

The client is repairing server data on read. That the generator can emit session
exercises with null targets at all is arguably the real defect, and a back-end
fix would make this whole mechanism unnecessary. Out of scope here, but if
someone establishes that nulls cannot occur, delete the repair rather than fix
it.

## Out of scope

- back-end: preventing null targets at generation time
- the `DEFAULT_SETS` / `DEFAULT_MIN_REPS` / `DEFAULT_MAX_REPS` values themselves

## Acceptance

- Offline, open an exercise with null targets → UI shows 3×8-12, no crash, no
  toast
- Back online, switch away and back → the patch fires and persists
- Flipping between two exercises repeatedly fires at most one PATCH per exercise
- No module-level mutable state left in `ExercisePage.tsx`
