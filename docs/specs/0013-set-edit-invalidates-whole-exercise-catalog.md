# Bug: Every set edit invalidates the whole exercise catalog

Status: ready-for-agent
Origin: monorepo depth review, 2026-09-03.
Scope: `packages/shared`

## Problem Statement

`useUpdateSet.onSuccess` tries to invalidate the history of the one exercise
whose set changed. It reads the cached session through the wrong shape, so the
lookup always fails and it falls back to invalidating **every** exercise query:

```ts
const sessionData = queryClient.getQueryData<{ data: any }>(['sessions', variables.sessionId]);
if (sessionData?.data) {
  // ... find the set log, invalidate ['exercises', id, 'history']
} else {
  // Fallback: invalidate all exercise histories if we can't find the specific one
  queryClient.invalidateQueries({ queryKey: ['exercises'] });
}
```

`useSession` caches `response.data`, so `exercises` sits at the **top level** of
the cache entry and `.data` is always `undefined`. The `else` branch is the only
branch that ever runs. Editing one set therefore invalidates the exercise
catalog, every catalog filter query, and every exercise's history.

The two adjacent hooks get the same cache shape right. `useDeleteSet.onMutate`
reads `cachedData?.exercises` directly, and `setLogMutations.ts` documents the
shape in a comment. Three siblings, two answers.

## Evidence

- `packages/shared/src/hooks/useApi.ts:900` — the `<{ data: any }>` read and the
  `sessionData?.data` branch
- `packages/shared/src/hooks/useApi.ts:771` — `useSession` returns
  `response.data`, which is what lands in the cache
- `packages/shared/src/hooks/useApi.ts:941` — `useDeleteSet` reading
  `cachedData?.exercises`, the correct shape
- `packages/shared/src/hooks/setLogMutations.ts:38-40` — the shape stated in a
  comment
- `packages/shared/src/hooks/setLogMutations.test.ts:26` — the shape asserted in
  a test

## Proposed change

Drop the `.data` indirection and read `exercises` from the top level, matching
`useDeleteSet`. `useDeleteSet` already solves the harder version of this problem
— it captures `exercise_id` in `onMutate` *before* the patch destroys it, and
returns it in the mutation context. Do the same here rather than re-reading the
cache in `onSuccess`.

Keep the fallback branch, but it should now be genuinely unreachable in the
normal case.

Note this is the tactical fix. The structural fix is 0024 — one owner for the
optimistic session patch, which removes the opportunity for three hooks to
disagree about the cache shape. Do this one first; it is small and independent.

## Out of scope

- the wider optimistic-update duplication (see 0024)
- introducing a key factory (see 0028)

## Acceptance

- Editing a logged set invalidates only that exercise's history
- The exercise catalog and its filter queries are not refetched on a set edit
- A test asserts the cache read against the shape `useSession` actually writes
