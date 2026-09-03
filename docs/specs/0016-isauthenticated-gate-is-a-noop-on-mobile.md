# Bug: The `isAuthenticated` query gate is a no-op on mobile

Status: needs-decision
Origin: monorepo depth review, 2026-09-03.
Scope: `packages/shared`, `apps/mobile`, `apps/web`

## Problem Statement

All 25 `useQuery` hooks in `packages/shared` carry `enabled: isAuthenticated()`.
On mobile that expression is always `true`:

```ts
function isAuthenticated(): boolean {
  try {
    const storage = getAuthStorage()
    const result = storage.getItem(AUTH_TOKEN_KEY)
    // Async storage (e.g. SecureStore on mobile): token presence is managed
    // by navigation guards in AuthContext; assume authenticated if storage is set.
    if (result instanceof Promise) return true
    return !!result
  } catch {
    return false
  }
}
```

`SecureStore.getItemAsync` always returns a Promise, so mobile takes the
`return true` branch unconditionally. The gate never gates anything there.

Three further problems, all platforms:

- **Not reactive.** It reads storage synchronously during render and nothing
  subscribes, so logging in does not flip `enabled`. Only an unrelated re-render
  does.
- **The throw is swallowed.** `getAuthStorage()` throws if `initAuth` has not
  run, and the `catch` turns that into `enabled: false` — so a query mounted
  before `initAuth` silently disables itself and never recovers on its own.
- **No caller can override it.** Only `useExerciseHistory` accepts an `enabled`
  option; the other 24 queries offer no way to opt out.

## Why this needs a decision, and why it is riskier than it looks

The gate is load-bearing on web and inert on mobile. "Fixing" it so it really
gates could **stop queries that work today** — mobile currently relies on the
gate being open plus the 401 bounce in `api.ts:88-91`.

The comment states the actual design: *"token presence is managed by navigation
guards in AuthContext"*. If that is true, the honest change is to **delete the
gate**, not repair it — an unauthenticated user never reaches a screen that
mounts these queries, and the 401 path handles the race. If it is not true, the
gate needs to become reactive, which means auth state must live somewhere
subscribable rather than being read out of storage mid-render.

Establish which before writing code.

## Evidence

- `packages/shared/src/hooks/useApi.ts:31-42` — the helper
- `packages/shared/src/auth.ts:20-25` — `getAuthStorage` throws
- `packages/shared/src/api.ts:88-91` — the 401 path that currently compensates
- `apps/mobile/src/context/AuthContext.tsx:12` — `initAuth` at module scope, so
  ordering depends on import order
- `apps/mobile/src/navigation/AppNavigator.tsx:32-36` — the navigation guards
  the comment refers to
- `packages/shared/src/hooks/useApi.ts:589-591` — the one hook that accepts an
  override

## What to establish first

- Can any of the 25 queries mount while `user` is null, on either platform?
- Does `setOnUnauthorized` reliably redirect? Both apps register it from a
  `useEffect` with a `null`-setting cleanup, so there is a window before mount
  and during unmount where a 401 clears the token and nothing navigates.

## Proposed change

Depends on the answer above. Either:

- **Delete the gate** and let navigation guards own it, documenting that in an
  ADR so it is not re-added; or
- **Make auth state reactive** — a subscribable store the hooks can read — and
  give every query an `enabled` override.

Do not leave it as-is: a guard that is documented, relied upon in review, and
inert in production is worse than no guard.

## Out of scope

- the `setOnUnauthorized` mount window (worth its own ticket if confirmed)

## Acceptance

- Either the gate is gone and an ADR records why, or it demonstrably gates on
  both platforms
- A test covers the pre-`initAuth` case, which currently fails silently
