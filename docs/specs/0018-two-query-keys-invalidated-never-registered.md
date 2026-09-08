# Bug: Two query keys are invalidated and never registered

Status: ready-for-agent
Origin: monorepo depth review, 2026-09-03.
Scope: `packages/shared`

## Problem Statement

Two of the 23 query-key shapes in `useApi.ts` are invalidated but never
registered by any `useQuery`. Both are silent no-ops.

**`['custom-plans']`** — invalidated once, by `useCompleteOnboarding`. The real
key is `['plans']`, registered by `usePlans`. The hook's own comment states the
intent:

```ts
// Invalidate plans and planner queries to refresh data after plan creation
queryClient.invalidateQueries({ queryKey: ['planner'] })       // works
queryClient.invalidateQueries({ queryKey: ['custom-plans'] })  // dead
```

So after onboarding generates a plan, the planner refreshes and the plans list
does not.

**`['user']`** — invalidated four times and registered nowhere. The user object
lives in `AuthContext` / `useAuth`, outside React Query entirely, so there is no
query to invalidate. `useUpdateProfile` writes `setQueryData(['profile'], ...)`
and then invalidates `['user']`; only the first call does anything.

## Evidence

- `packages/shared/src/hooks/useApi.ts:102` — `['custom-plans']`
- `packages/shared/src/hooks/useApi.ts:166` — `usePlans` registering `['plans']`
- `packages/shared/src/hooks/useApi.ts:65,109,139,237` — the four `['user']`
  invalidations
- no `useQuery` anywhere in the repo registers either key

## Proposed change

- Change `['custom-plans']` to `['plans']`.
- Delete all four `['user']` invalidations. If any of those call sites actually
  needs the user object refreshed, the correct action is `refreshUser()` from
  `AuthContext` (mobile) / `refetchUser()` (web) — check each of the four and
  call it where the intent was real, rather than deleting blindly.

Both are one-line changes. The reason they survived is that nothing makes a key
typo visible: 107 hand-built key literals with no factory. 0028 is the structural
fix.

## Out of scope

- the redundant invalidations that *do* work but are already covered by a prefix
  (e.g. `useCancelSession` invalidating both `['sessions']` and
  `['sessions','today']`) — harmless, note them for 0028

## Acceptance

- Completing onboarding refreshes the plans list
- No `queryKey` in the repo is invalidated without a matching registration
- Where `['user']` was removed, the intended refresh still happens
