# Architecture: A toast mechanism for `apps/web`

Status: done — landed with 0014 on `fix/depth-review-bugs`
Origin: promoted from 0031 entry 1 (monorepo depth review, 2026-09-03).
Scope: `apps/web`

## Problem Statement

`apps/web` had no way to tell the user that something failed. There was no
`MutationCache`/`QueryCache` `onError`, no toast component, and the only
user-visible failure messaging in the whole session flow was two bare `alert()`
calls. `EmailVerificationPage.tsx` commented that *"other errors surface via
global mutation cache toast"* — a toast that did not exist. Twenty-three
`console.error` catches across the app were, on a phone with no console
attached, indistinguishable from success.

Mobile solved this in 0002: `src/lib/toast.ts` + `ToastHost.tsx`, and a
structural guard that fails if any catch in the session flow goes silent.

## Change

- `apps/web/src/lib/toast.ts` — the same store shape as mobile's
  (`showToast(message, kind, ttl)`, `dismissToast`, `useToasts`), with the
  auto-dismiss timer tracked so a manual dismiss clears it. Unit-tested with
  fake timers.
- `apps/web/src/components/ToastHost.tsx` — mounted in `App.tsx` beside the
  `NetworkStatusBanner`, one z-index below it.
- `useWorkoutSessionState.ts` — all nine catches surface a message, in mobile's
  0002 wording; both `alert()`s become toasts. Guarded by
  `workout-session-failures-surfaced.test.ts`, the web twin of mobile's.
- `EmailVerificationPage.tsx` — the comment's claim is now true: a failed resend
  says so.

## Still silent

Fourteen catches outside the session hook: `WorkoutPreviewPage.tsx` (5),
`EditWorkoutPageWrapper.tsx` (3), `ProgramDashboard.tsx` / `ProgramControls.tsx`
/ `DashboardPage.tsx` (2 each). Wiring them is 0011 (web parity) and 0026
territory; the mechanism they need now exists.

A global `MutationCache.onError` fallback, as mobile has, was deliberately not
added: with per-catch toasts in place it would show every session failure twice.
