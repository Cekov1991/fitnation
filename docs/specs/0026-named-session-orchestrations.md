# Architecture: Named orchestrations for the multi-write invariants

Status: ready-for-agent
Origin: monorepo depth review, 2026-09-03. Absorbs part 2 of `docs/specs/0006`.
Scope: `packages/shared`, `apps/mobile`, `apps/web`
Depends on: 0023 (read model), 0024 (`target_sets` ownership)

## Problem Statement

Several domain actions are two or more writes that only mean something together,
and every one is orchestrated inside a component where no test can reach it. If
a later write fails, the user is left in a state no single request describes.

The worst case — the in-session exercise swap — is filed separately as **0014**,
because the safe path already exists and only needs switching on.

The rest:

### Set removal — both apps

```
await deleteSet.mutateAsync({ sessionId, setLogId })
await updateSessionExercise.mutateAsync({ data: { target_sets: targetSets - 1 } })
```

If the second fails, the log is gone but the slot remains: the removed set
reappears as an empty **pending** row and the exercise silently un-completes. To
the user, "Remove Set" blanked out their numbers and did nothing else.

`docs/specs/0006` covers this and concluded the client is the only place it can
be made safe, given the server's explicit statement that `target_sets` is
client-owned.

Mobile's single `catch` reports *"Couldn't change the number of sets."* — the
message for the **second** write — which is wrong if the first is what failed.
Web's `catch` is `console.error`, and its `setShowSetMenu(false)` /
`setSelectedSetId(null)` sit inside the `try`, so on failure the menu stays open
too.

### Clone-then-activate a library Program — mobile

```ts
const result = await cloneProgram.mutateAsync(confirmProgram.id)
const clonedId = (result as any)?.data?.id
if (clonedId != null) {
  await updateProgram.mutateAsync({ programId: clonedId, data: { is_active: true } })
  ...
}
```

If the activate fails: an **inactive orphan clone** now sits in the user's
program list. If `clonedId` is null the clone happened and **nothing at all** is
reported — no toast, no navigation, the dialog stays open.

### Delete account, then log out — mobile

```ts
await deleteAccount.mutateAsync(password)
await logout()
```

`logout()` swallows its own network call, but `SecureStore.deleteItemAsync` and
`clearLastDeviceRegistration` are outside that try. If either throws, the account
is deleted server-side and the app still holds a token and a `user` object — and
the dialog shows an error for an account that no longer exists.

### Push toggle — mobile

OS permission grant, then a settings PATCH. If the grant succeeds and the PATCH
fails, the phone is registered for push while `push_enabled` is false. The
`catch` comment says `// reverted below`, but the `finally` only clears the
optimistic value; the real revert is a fallback to a stale query value.

### Onboarding submit — both apps

Profile save, then complete-onboarding (or regenerate-plan). If the second fails,
the profile is saved but `onboarding_completed_at` is unset, so the next launch
sends the user back to Onboarding. "Try Again" re-runs **both**, re-PUTting the
profile.

Web's version has a further defect: `CompleteStep.tsx:69` calls `generatePlan()`
**without `await`** from inside `saveProfile`'s `try`, so `saveProfile` resolves
before the second step runs and its rejection can never be caught there. And a
`PLAN_GENERATION_MIN_DELAY_MS = 10_000` means a failure is not shown for ten
seconds.

### Workout day swap — web

Two `updateTemplate` calls exchanging `day_of_week`. If the second fails,
**both templates sit on the same day** — the exact collision the `occupiedDays`
map in `AddWorkoutPage.tsx:107-120` exists to prevent.

## The one that already rolls back

`apps/web/.../EditWorkoutPage.tsx:199-219` reverts local state on a failed
reorder, and `apps/mobile/.../WorkoutPreviewScreen.tsx:60-71` does the same with
an explicit `user-feedback:` opt-out comment. These are the shape to copy.

## Evidence

- `apps/mobile/.../ExercisePage.tsx:275-300` — set removal
- `apps/web/.../useWorkoutSessionState.ts:334-354` — set removal
- `apps/mobile/.../ProgramLibraryScreen.tsx:24-40` — clone then activate
- `apps/mobile/.../ProfileScreen.tsx:866-869` — delete then logout
- `apps/mobile/.../ProfileScreen.tsx:250-266` — push toggle
- `apps/mobile/.../OnboardingScreen.tsx:123-142` — onboarding submit
- `apps/web/.../onboarding/CompleteStep.tsx:47-102` — onboarding submit, unawaited
- `apps/web/.../route-wrappers/EditWorkoutPageWrapper.tsx:62-103` — day swap
- `docs/specs/0006` — the set-removal analysis

## Proposed change

Each sequence becomes a named module in `packages/shared` owning the whole
action and its compensation, callable from both apps. For each: what to retry,
what to compensate, and what to tell the user — including *which* write failed,
which the current single `catch` cannot express.

Order within this ticket: set removal first, since 0006 already specifies it and
0024 has made `target_sets` ownership unambiguous. Then onboarding submit, which
is the one that strands a user across launches.

Note `apps/web` has no toast mechanism at all — `EmailVerificationPage.tsx:70`
comments *"Other errors surface via global mutation cache toast"* and that toast
does not exist. The error-surfacing half of this ticket is blocked on building
one; the compensation half is not.

## Out of scope

- the in-session swap — 0014
- building a toast mechanism for `apps/web` — note as a blocker
- `docs/specs/0002`, which covers mobile's session-screen error surfacing

## Acceptance

- Each sequence is one named call with one owner
- A failure in any later write leaves a state the user can understand, and the
  message names what actually failed
- Tests drive each sequence with the second write rejecting — the assertion that
  is currently impossible to write
- No orphan clones, no deleted-account-with-live-token, no two templates on one
  day
