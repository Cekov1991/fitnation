---
status: accepted
---

# Navigation guards own authentication; queries do not gate on it

Every `useQuery` in `packages/shared` used to carry `enabled: isAuthenticated()`.
On mobile that expression was always `true` — `SecureStore.getItemAsync` returns a
Promise, and the helper returned `true` for any Promise — so the gate gated
nothing there. On both platforms it read storage synchronously during render
and subscribed to nothing, so logging in did not flip it; and it swallowed the
throw from `getAuthStorage()` into `enabled: false`, so a query mounted before
`initAuth()` silently disabled itself and never recovered (app spec 0016).

We delete the gate rather than make it reactive. Whether a screen that needs a
user may render is already decided in exactly one place per platform — the
navigation guards (`AppNavigator` on mobile, `AuthGuard` on web) — which read
the same `user` the queries would have to. A query can only mount behind those
guards, so a second gate on the token could only ever disagree with the first.
If one does fire without a token, the server answers 401 and the typed HTTP
seam (`ApiFailure.unauthorized`, app spec 0025) clears the session and tells the
app, which is the same path the guards rely on.

A guard that is documented, relied upon in review, and inert in production is
worse than no guard. Do not re-add `enabled: isAuthenticated()`; a structural
test fails if it returns.

## Considered Options

- **Keep the gate and make it reactive** — a subscribable auth store the hooks
  read, plus an `enabled` override on every query. Rejected: it duplicates the
  decision the navigation guards already make, and every hook grows an option
  that exists only to bypass a gate nothing needs.
- **Delete the gate** (chosen). Queries are enabled by their own arguments
  (`!!sessionId`, `!!planId`, …) and nothing else. The one query that was never
  gated on auth — the Partner branding for a host name — is public by design.
