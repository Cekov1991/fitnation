# Bug: Partner branding survives logout

Status: ready-for-agent
Origin: monorepo depth review, 2026-09-03.
Scope: `apps/mobile`

## Problem Statement

`logout()` clears everything except the theme. Log out of a white-label Partner
account and into a plain Fit Nation account, and the previous Partner's brand
colours stay painted across the app until a cold start.

`logout()` clears the token, the Device heartbeat record, the Google sign-in
session, the React Query cache and `user` — but never calls `setColors`. And
`applyPartnerColors` early-returns when the incoming user has no
`visual_identity`, so signing in as a partnerless user does not overwrite them
either:

```ts
function applyPartnerColors(currentUser: UserResource) {
  const identity = currentUser.partner?.visual_identity
  if (!identity) return          // <- leaves the previous partner's colours in place
  setColors({ ... })
}
```

`ThemeContext` accumulates into `overrides` and has no reset path at all — the
only writer is `setColors`, which merges.

## Second problem: the dependency is inverted

`AuthContext` imports `useTheme` and consumes `setColors`, so authentication
depends on theming. That makes `App.tsx`'s provider nesting load-bearing —
`ThemeProvider` must wrap `AuthProvider` — and nothing states or enforces it.
Reordering the two providers compiles and breaks at runtime.

## Evidence

- `apps/mobile/src/context/AuthContext.tsx:138-157` — `logout()`, no colour reset
- `apps/mobile/src/context/AuthContext.tsx:68-78` — `applyPartnerColors` and its
  early return
- `apps/mobile/src/context/AuthContext.tsx:8,49` — the `useTheme` import
- `apps/mobile/src/context/ThemeContext.tsx:17,21-23` — `overrides` and the
  merge-only `setColors`
- `apps/mobile/App.tsx:89-90` — the nesting the inversion requires

## Proposed change

Two parts, in order.

**1. Add a reset.** Give `ThemeContext` a way to clear overrides, call it from
`logout()`, and make `applyPartnerColors` reset rather than early-return when
the incoming user has no `visual_identity` — a plain account should look plain,
not inherit.

**2. Invert the dependency.** Have the theme derive the Partner identity from
auth state rather than auth pushing colours into the theme. This removes the
provider-ordering requirement and gives the reset for free, since a partnerless
user resolves to the default palette by construction.

Part 2 is the seam described in 0029; if that is being done soon, do part 1 now
as the bug fix and let 0029 carry part 2.

## Out of scope

- which fields a Partner may override (currently only `primary` and `secondary`,
  deliberately)
- the web equivalent, which resolves branding differently (see 0029)

## Acceptance

- Log out of a Partner account, log into a plain account → default Fit Nation
  colours, no cold start needed
- Log out of Partner A, log into Partner B → B's colours, none of A's
- A test covers the partnerless-after-partner transition
