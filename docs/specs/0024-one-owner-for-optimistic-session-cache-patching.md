# Architecture: One owner for optimistic Session cache patching

Status: ready-for-agent
Origin: monorepo depth review, 2026-09-03. Absorbs part 1 of `docs/specs/0006`.
Scope: `packages/shared`

## Problem Statement

Four mutation hooks carry roughly 300 lines of hand-written cache surgery
between them. Each presents a small interface over the same five steps — cancel
queries, snapshot for rollback, walk `old.exercises`, spread-rebuild, restore on
error — typed `(old: any)` every time.

| Hook | Lines | Body |
|---|---|---|
| `useUpdateSet` | 90 | `:829-918` |
| `useDeleteSet` | 101 | `:919-1017` |
| `useUpdateSessionExercise` | 63 | `:1037-1099` |
| `useRemoveSessionExercise` | 46 | `:1117-1162` |

The preamble is byte-identical in all four:

```ts
onMutate: async (variables) => {
  // Cancel ongoing queries to prevent race conditions
  await queryClient.cancelQueries({ queryKey: ['sessions', variables.sessionId] });
  // Snapshot previous data for rollback
  const previousData = queryClient.getQueryData(['sessions', variables.sessionId]);
```

and so is the epilogue, differing only in the log string.

**This is not a tidiness complaint — the copies have already drifted into a
bug.** `useUpdateSet` reads the cache through a `.data` indirection that does not
exist, so it always takes its fallback branch and invalidates the whole exercise
catalog. That is 0013. `useDeleteSet` and `setLogMutations.ts` read the same
cache correctly. Three siblings, two answers, and no test could tell.

## The counter-example is already in the repo

`setLogMutations.ts` is 150 lines behind a **3-line** hook
(`useApi.ts:825-828`). It owns the provisional-id sentinel and its uniqueness
guarantee under same-millisecond double-taps, the server-matching resolution
order for which exercise row receives a set, and a **targeted** rollback rather
than a snapshot — with the reason written down (`:127-131`: a snapshot rollback
would retract a *second* in-flight log) and proven by
`setLogMutations.test.ts:194-214`.

Its own comment says it was *"split out from the hook so the optimistic append
and its rollback can be driven by a test without React"*. That is the pattern.
It has been applied once.

## Second problem: `target_sets` has two writers

`useDeleteSet.onMutate` decrements `target_sets` optimistically:

```ts
target_sets: Math.max(1, (exDetail.session_exercise.target_sets || 1) - 1)
```

while the caller separately sends an **absolute** `target_sets - 1` computed
before the delete. `docs/specs/0006:33-45` documents this: they converge *"by
luck, not by design"*, and `useDeleteSet` is *"lying about ownership: it is
writing a field its own request explicitly does not touch"* — the server comment
is explicit that `target_sets` is client-owned and `deleteSet` does not modify it.

This matters beyond tidiness because `target_sets` is the loop bound of the slot
model in 0023. A read model deriving from a field two writers can move is
materially harder to reason about.

## Third problem: the invariant leaks to callers

`setLogMutations.ts` exports `isProvisionalSetLogId` as a public predicate, but
`useUpdateSet` and `useDeleteSet` accept any `setLogId: number` and will happily
`PUT .../sets/-1756300000000`. Four call sites must remember the check —
`useWorkoutSessionState.ts:181`, `ExercisePage.tsx:233`, `:251`, `:283` — and one
of them calls itself *"belt and braces"* in a comment.

## Evidence

- the four hook bodies above
- `packages/shared/src/hooks/useApi.ts:938-949` — `useDeleteSet`'s pre-mutate
  scan for `exercise_id`, a workaround for the missing primitive
- `packages/shared/src/hooks/useApi.ts:900` — the shape bug (0013)
- `packages/shared/src/hooks/setLogMutations.ts` — the deep version
- `packages/shared/src/hooks/setLogMutations.test.ts` — 229 lines, no React

## Proposed change

Three parts.

**1. A patching primitive.** One module owning "apply a function to the cached
Workout Session, with cancellation, snapshot and rollback", typed against the
real payload shape rather than `any`. The four hooks keep only their own intent:
which row, which field.

**2. One owner for `target_sets`.** Remove the decrement from
`useDeleteSet.onMutate` and leave the field to `useUpdateSessionExercise`, whose
request actually owns it — `docs/specs/0006` part 1. `useDeleteSet` keeps the log
removal and the `set_number` re-sequencing, which do mirror its own endpoint.

**3. Make the provisional-id invariant unrepresentable.** Have the set-mutation
interfaces reject a provisional id rather than relying on four callers to check.

## Do not tidy the `set_number` re-sequencing

`useDeleteSet.onMutate` shifts every later set's `set_number` down by one, with
the comment *"to match the server's re-sequencing (keeps numbering contiguous)"*.
That exists because the read model matches logs to slots by `set_number` — it is
a read-side rule living in the write path. If `docs/specs/0005` resolves as
"target is a floor, logs are truth", it may need to change shape.

**Port it as-is and leave a comment pointing at 0005.** Cleaning it up now risks
building something 0023 then has to fight.

## Out of scope

- the two-request removal *sequence* itself — `docs/specs/0006` part 2, and 0026
- the read-side derivation — 0023
- key construction — 0028 (land that first, so this is written against a
  registry rather than literals)

## Acceptance

- One typed traversal of the cached session; no `(old: any)` in the four hooks
- 0013's bug class is structurally impossible
- `target_sets` has exactly one optimistic writer
- A provisional set-log id cannot be passed to update or delete
- The primitive is covered by tests that do not mount React, as
  `setLogMutations.test.ts` already demonstrates
