# Bug: The live session still runs the five-step exercise swap

Status: ready-for-agent
Origin: monorepo depth review, 2026-09-03.
Scope: `apps/web`

## Problem Statement

Swapping an exercise mid-session runs five sequential writes with no rollback:

```
await removeSessionExercise.mutateAsync({ ... })   // 415
await addSessionExercise.mutateAsync({ ... })      // 419
await queryClient.refetchQueries({ ... })          // 434
const session = queryClient.getQueryData(...)      // 435
await reorderSessionExercises.mutateAsync({ ... }) // 447
```

If the add fails after the remove succeeded, **the exercise and all its logged
sets are gone with nothing to restore them**. If anything from the refetch
onward fails, the exercise exists at the wrong position and
`currentExerciseIndex` points elsewhere. The `catch` is `console.error` only.

## Why this is a regression, not an oversight

The safe path already exists and both sibling callers were deliberately moved
onto it. Their commit comments name this exact hazard:

> *"This replaced a remove + add + refetch + reorder sequence... That sequence
> could leave the session mangled if any step after the delete failed"*
> — `route-wrappers/WorkoutPreviewExercisePickerWrapper.tsx:57-73`

> *"That sequence had four failure points between the delete and the restore —
> an error partway through lost the user's pivot data outright."*
> — `route-wrappers/ExercisePickerPageWrapper.tsx:44-60`

`useSwapSessionExercise` is exported from `packages/shared` and hits
`PATCH .../exercises/{sessionExercise}/swap`, which changes `exercise_id` on the
existing row and nothing else — so sets, reps and row position survive by
construction.

The two lower-stakes callers were fixed. The live session, the only path where
the user has real logged sets at risk, was not.

## Evidence

- `apps/web/src/components/workout-session/hooks/useWorkoutSessionState.ts:410-456`
  — the five-step sequence and its `console.error` catch
- `apps/web/src/route-wrappers/WorkoutPreviewExercisePickerWrapper.tsx:57-73` —
  the migrated sibling, with rationale
- `apps/web/src/route-wrappers/ExercisePickerPageWrapper.tsx:44-60` — the other
  migrated sibling
- `packages/shared/src/hooks/useApi.ts:1100` — `useSwapSessionExercise`
- mobile note: `apps/mobile` reaches the same endpoint from
  `ExercisePickerScreen.tsx` — confirm mobile's in-session swap is not on the
  old sequence too before closing this

## Proposed change

Replace the sequence in `handleSwapExercise` with a single
`useSwapSessionExercise` call, mirroring the two wrappers. The `swapIndex`
bookkeeping, the `refetchQueries`/`getQueryData` round trip used to recover the
new row id, and the trailing reorder all become unnecessary — the row is
modified in place, so its position never changes.

Surface the failure to the user rather than `console.error` (see 0002 for the
mobile equivalent; `apps/web` has no toast mechanism at all today).

## Out of scope

- building a toast mechanism for `apps/web` — note it as a blocker for the
  error-surfacing half, do not build it here
- the other multi-write sequences (see 0026)

## Acceptance

- An in-session swap issues exactly one request
- Logged sets, target sets/reps and row position survive a swap
- A failed swap leaves the session exactly as it was, and says so
