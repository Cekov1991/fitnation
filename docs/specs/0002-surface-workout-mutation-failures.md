# Spec: Surface mutation failures in the workout session UI

Status: ready-for-agent
Origin: workout session screen review, 2026-08-27. Deferred from `plans/stage-14-mobile-session-simplification.md`.
Scope: `apps/mobile` (web has the same shape — see 0011)

## Problem Statement

Every mutation in the live session and preview screens swallows its error into
`console.error`. On a device with no console attached, a failed request is
indistinguishable from success-with-no-visible-change: the spinner stops, the
row does not update, and the user is told nothing.

This matters most for `handleLog`. Logging a set is the action a user performs
20+ times per workout, in a gym, on the worst wifi they will encounter all day.
Today a dropped request means the set silently does not exist — and because the
input is cleared only on success, the user's typed values do survive, which is
the one piece of luck in the current behaviour.

The user's most likely reading of a failed log is "the button didn't register",
so they tap again. If the first request actually succeeded and only the response
was lost, they now have a duplicate.

## Evidence

Thirteen silent catches across the session flow:

- `src/screens/placeholders/WorkoutSessionScreen.tsx` :87, :191, :210, :224
  (cancel-from-back-intercept, remove exercise, complete, cancel)
- `src/components/workout-session/ExercisePage.tsx` :179, :208, :248, :273
  (log set, add set, update set, remove set)
- `src/screens/placeholders/WorkoutPreviewScreen.tsx` :135, :154, :83, :101, :114
  (remove, update, confirm, regenerate, cancel)

`showToast(message, kind)` already exists at `src/lib/toast.ts` and is already
used in this feature for validation messages (`ExercisePage.tsx` "Remove the
exercise instead of the last set.", `WorkoutSessionScreen.tsx` "The workout
needs at least one exercise.").

## Proposed change

Every `catch` in the list above gains a `showToast(..., 'error')` alongside the
existing `console.error`. Keep the log — it is useful in dev — and add the user
half.

Messages should say what did not happen, in the user's terms, not the API's:

| action | message |
|--------|---------|
| log set | `Couldn't save that set. Check your connection and try again.` |
| update set | `Couldn't update the set.` |
| add / remove set | `Couldn't change the number of sets.` |
| remove exercise | `Couldn't remove that exercise.` |
| complete session | `Couldn't finish the workout. Your sets are saved — try again.` |
| cancel session | `Couldn't cancel the workout.` |
| confirm draft | `Couldn't start the workout.` |
| regenerate draft | `Couldn't generate a new workout.` |

The complete-session message deserves its wording: sets are logged
individually and are already persisted, so a failed *finish* has not lost the
workout. Saying so is the difference between a retry and a panic.

Two cases need more than a toast:

- **Finish failure** leaves the user on the session screen with `isCleanExitRef`
  still `false`, which is correct — do not navigate. Confirm the ConfirmDialog
  closes so the retry is reachable.
- **Cancel-from-back-intercept failure** (`:87`) currently leaves the user
  trapped: the navigation action is never dispatched and `backInterceptAction`
  stays set, so the dialog is still open over a session they asked to leave.
  Clear `backInterceptAction` on failure so the dialog closes and the screen
  stays put, and toast.

## Out of scope

- retry-on-failure or offline queueing (see 0003)
- duplicate-log detection for the double-tap case above
- distinguishing network failure from 4xx; one message per action is enough here

## Acceptance

- Airplane mode, tap **Log Set** → error toast, set not marked complete, typed
  values still in the inputs
- Airplane mode, tap **Finish** → error toast, still on the session screen,
  dialog dismissed, Finish tappable again
- Airplane mode, hardware back → **Cancel Workout** → error toast, dialog
  closed, still on the session screen
- No `catch` block in the three files logs without also showing something
