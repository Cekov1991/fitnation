# Spec: Optimistic set logging

Status: ready-for-agent
Origin: workout session screen review, 2026-08-27. Deferred from `plans/stage-14-mobile-session-simplification.md`.
Scope: `packages/shared` (consumed by mobile and web)

## Problem Statement

`useLogSet` has no optimistic update. Its siblings `useUpdateSet` and
`useDeleteSet` both do — they snapshot, patch the cache, and roll back on
error. Logging a set, the most frequent action in the app, is the one that makes
the user wait on a network round trip before the UI acknowledges it.

The visible cost: tap **Log Set**, the button shows a spinner
(`SetLogCard` `isPending`), and nothing else changes until the server replies
and the invalidated `['sessions', id]` query refetches. On gym wifi that is a
noticeable stall between sets, repeated every set of every exercise.

The asymmetry is also a maintenance hazard — a reader of `useApi.ts` reasonably
assumes the three set mutations behave alike.

## Evidence

- `packages/shared/src/hooks/useApi.ts:790` — `useLogSet`, `onSuccess`-only:
  invalidate `['sessions', sessionId]` and the exercise history
- `useApi.ts:810` — `useUpdateSet` with full `onMutate` / `onError` rollback
- `useApi.ts:900` — `useDeleteSet` with the same pattern, including
  re-sequencing `set_number` in the cache to match the server

`useDeleteSet` is the closer model: it already handles the harder problem of
keeping `set_number` contiguous in the optimistic cache.

## Proposed change

Give `useLogSet` an `onMutate` in the shape the neighbours already establish:

1. `cancelQueries(['sessions', sessionId])`
2. snapshot `previousData`
3. append a provisional `SetLogResource` to the matching exercise's
   `logged_sets` — `exercise_id`, `set_number`, `weight`, `reps`,
   `rest_seconds` are all in `variables.data`
4. return `{ previousData }`; `onError` restores it; `onSuccess` invalidates as
   it does today

The provisional row needs an `id`. The UI keys off it (`SetOptionsMenu` edit
targets `logId`, `ExercisePage` slots carry `logId`), so it cannot be omitted.
Use a negative sentinel (`-Date.now()`) and treat a negative `id` as
not-yet-persisted: the ⋯ menu's **Edit Set** should be unavailable for that row
until the real id arrives. Editing a row whose id the server has never seen
would fire `updateSet` against a nonexistent `setLogId`.

The window is short — one request — but it is exactly the window in which an
impatient user pokes at the row they just created.

## Interaction with the rest of the flow

- **Rest timer.** `handleLog` starts the timer after `mutateAsync` resolves. With
  an optimistic update the row appears immediately but the timer still waits on
  the response, which will read as a bug. Move the timer start to fire with the
  optimistic row.
- **Haptics.** Same reasoning — `Haptics.notificationAsync` should accompany the
  optimistic row, not the response.
- **Completion state.** `isExerciseComplete` (see stage 14) counts logged slots,
  so the tab and the FINISH WORKOUT footer will both react optimistically. That
  is the intent; note that a rollback can therefore retract a "complete" tab.

## Out of scope

- offline queue / persistence across app restart
- duplicate-log protection
- `useAddSessionExercise`, `useRemoveSessionExercise`,
  `useReorderSessionExercises` (also non-optimistic; separate, lower-frequency)

## Acceptance

- With the network throttled, tapping **Log Set** marks the set complete, fires
  the haptic and starts the rest timer immediately
- A failed log rolls the row back out of the list and toasts (0002)
- The ⋯ menu on a not-yet-persisted row offers no **Edit Set**
- `pnpm test` passes; add a `packages/shared` test asserting rollback restores
  the previous `logged_sets`
