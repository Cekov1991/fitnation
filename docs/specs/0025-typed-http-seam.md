# Architecture: A typed HTTP seam

Status: ready-for-agent
Origin: monorepo depth review, 2026-09-03.
Scope: `packages/shared`, then `apps/web`, `apps/mobile`

## Problem Statement

`fetchWithAuth` declares no return type. `response.json()` is `Promise<any>`, so
the `any` propagates through all 79 `api.ts` methods — only **9** annotate a
return type — and then through every hook:

```ts
const response = await plansApi.getPlans();  // response: any
return response.data;                        // hook data: any
```

So `usePlans`, `useSession`, `useTemplates`, `useCalendar`, `useFitnessMetrics`
and the rest all hand back `any`, **despite 711 lines of clean, `any`-free types
sitting in `types/api.ts`**. Roughly 10 response wrapper types
(`DataResponse`, `ListResponse`, `TodayWorkoutResponse`, `CalendarResponse`,
`ExerciseHistoryResponse`, …) have zero external references.

This hides real bugs from `tsc`, not just from tests:
`apps/web/.../EditWorkoutPage.tsx:164-180` builds an object that omits
`muscleGroupImageUrl` although its own local `Exercise` interface requires it. It
compiles because `useTemplate` returns untyped `response.data`.

### The error contract is declared and unused

`types/api.ts:706-711` declares `ValidationError` and `ApiError`. **Both have
zero references anywhere in the repo.** What actually gets thrown is an `any`
with two undeclared properties:

```ts
const err: any = new Error(data.message || 'An error occurred');
err.status = response.status;
err.errors = data.errors;
```

Consequences a caller cannot see from any signature:

- **Network failure is indistinguishable from an HTTP error.** A `fetch`
  rejection (offline, DNS, TLS) has no `.status`, so `err.status === 401` and
  `=== 422` are both false and every caller falls into its generic branch.
- **401 is consumed *and* rethrown.** `api.ts:88-91` clears the token and fires
  `notifyUnauthorized`, then throws — so a caller catches a 401 whose side
  effects have already happened, with no flag saying so.
- **422 is normalised by hand at 7 sites**, five of them repeating
  `Array.isArray(err.errors.X) ? err.errors.X[0] : err.errors.X` because the type
  says `string | string[]` and nobody knows which. Laravel always sends
  `string[]`.
- **Two helpers with invisible differences.** `fetchPublic` and `fetchWithAuth`
  use different fallback messages, only `fetchWithAuth` handles 204 /
  `content-length: 0`, and only it fires the 401 side effect. Which one an
  endpoint uses is not visible from its signature — and `authApi.login` and
  `authApi.register` use `fetchWithAuth` for *unauthenticated* endpoints, so a
  stale-token 401 during login clears the token and fires the redirect.

### Callers compensate by string-matching

- `apps/web/.../ResetPasswordPage.tsx:354-356` classifies errors with
  `msg.toLowerCase().includes('token') || ...'invalid' || ...'expired'`
- `apps/web/.../onboarding/CompleteStep.tsx:94` recovers an onboarding invariant
  with `errorMessage.includes('already been completed') || ...'status: 409'`

Both are parsing prose to recover a status code the throw already had.

## Evidence

- `packages/shared/src/api.ts:36-54` — `fetchPublic`
- `packages/shared/src/api.ts:57-98` — `fetchWithAuth`, no return type
- `packages/shared/src/types/api.ts:706-711` — the unused error types
- the 7 hand-rolled 422 branches: `ForgotPasswordPage.tsx:37`,
  `ResetPasswordPage.tsx:355-367`, `EmailVerificationPage.tsx:66`,
  `ForgotPasswordScreen.tsx:37`, `EmailVerificationScreen.tsx:94`,
  `ResetPasswordScreen.tsx:53-64`

## Proposed change

**1. One request function** returning typed data, replacing both helpers — with
authentication as an argument rather than a separate function, so the choice is
visible at the call site.

**2. A discriminated failure type** so callers branch on a tag, not a sniffed
`.status`: validation (with typed field errors), unauthorized, network, and
generic http. Normalise `string | string[]` once, at the seam.

**3. Annotate `api.ts`** against the types that already exist. This is the bulk
of the work and it is mechanical; it can land namespace by namespace.

**4. Then delete the compensations** — the 5 array-or-scalar unwraps and the 2
string-matched classifications.

Expect real type errors to surface during step 3. That is the point —
`EditWorkoutPage.tsx:164-180` is one already known.

## Out of scope

- the `enabled: isAuthenticated()` gate — 0016
- retry and stale-time policy, which no hook currently exposes

## Acceptance

- No hook returns `any`
- `ValidationError` / `ApiError` are either used or deleted, not declared and
  ignored
- A caller can distinguish offline from 422 from 401 without reading a message
- Field-level validation errors reach a form without per-call-site normalisation
- 401's side effects are visible to the code that catches it
