# Spec: Set removal splits a client-owned invariant across two requests

Status: ready-for-agent
Origin: workout session screen review, 2026-08-27. Deferred from `plans/stage-14-mobile-session-simplification.md`.
Scope: `apps/mobile`, `packages/shared`

## Problem Statement

Removing a logged set takes two sequential requests, and the invariant they
maintain together is not protected if the second one fails.

```
await deleteSet({ sessionId, setLogId })                        // request 1
await updateSessionExercise({ target_sets: targetSets - 1 })     // request 2
```

If request 1 succeeds and request 2 fails, the log is gone but `target_sets` is
unchanged — the removed set reappears as an empty **pending** row. To the user,
"Remove Set" did nothing except blank out their numbers. There is no toast today
(see 0002), so the failure is invisible; the only symptom is a set they thought
they deleted, now empty, sitting in the list.

This is not a server defect. The server is explicit that the split is deliberate:

> *"Delete the set and re-sequence the remaining sets so their `set_number` stays
> contiguous (1..N). `target_sets` is owned by the client, which decrements it via
> `updateSessionExercise`, so we don't touch it here."*
> — `back-end/app/Http/Controllers/Api/WorkoutSessionController.php:229-231`

Given that ownership, the client is the only place the two-step can be made safe.

## Second problem: a compounding optimistic decrement

`useDeleteSet.onMutate` already decrements `target_sets` in the cache:

```js
target_sets: Math.max(1, (exDetail.session_exercise.target_sets || 1) - 1)
```

Then `handleRemoveFromMenu` fires `updateSessionExercise` with an absolute
`targetSets - 1`, computed from the value captured *before* the delete. Because
the second write is absolute rather than relative, the two converge on the same
number and the bug does not surface today.

It converges by luck, not by design. Change either side to a relative update and
the target drops by two. The optimistic decrement in `useDeleteSet` is also
lying about ownership: it is writing a field its own request explicitly does not
touch.

## Evidence

- `src/components/workout-session/ExercisePage.tsx` — `handleRemoveFromMenu`,
  the two awaits, no compensation on partial failure
- `packages/shared/src/hooks/useApi.ts:900` — `useDeleteSet.onMutate` decrements
  `target_sets` optimistically
- `back-end/.../WorkoutSessionController.php:221-249` — `deleteSet`, transaction
  covers the delete and re-sequence only

## Proposed change

Two parts, in order.

**1. One owner for the optimistic decrement.** Remove the `target_sets` write
from `useDeleteSet.onMutate` and leave it to `useUpdateSessionExercise`, which
already has its own `onMutate`/rollback and whose request actually owns the
field. `useDeleteSet` keeps the log removal and the `set_number` re-sequencing —
those mirror what its own endpoint does.

**2. Compensate on partial failure.** If `updateSessionExercise` rejects after
`deleteSet` resolved, the client is in a known-inconsistent state. Retry the
target update once; if it fails again, invalidate `['sessions', sessionId]` so
the UI resynchronises to server truth rather than showing an optimistic state
that no longer matches, and toast per 0002. The user sees the real state — one
fewer log, target unchanged — instead of a phantom.

Note this leaves a real orphan case: `target_sets` stayed high, so the row
becomes pending, not hidden. That direction is benign. The hidden-log direction
is 0005.

## Out of scope

- moving `target_sets` ownership to the server, or a combined endpoint. Either
  would obsolete this spec; both are back-end stories.
- `handleAddSet`, which is a single request and already safe

## Acceptance

- `useDeleteSet.onMutate` no longer writes `session_exercise.target_sets`
- Removing a completed set with both requests succeeding behaves exactly as
  today
- With `updateSessionExercise` forced to fail, the session resyncs from the
  server and toasts; no state where the UI shows a target the server disagrees
  with
- Add a `packages/shared` test asserting `useDeleteSet` rollback restores
  `logged_sets` and leaves `target_sets` untouched
