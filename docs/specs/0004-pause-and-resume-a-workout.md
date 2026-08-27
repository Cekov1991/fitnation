# Spec: Pause and resume a workout instead of destroying it

Status: needs-decision
Origin: workout session screen review, 2026-08-27. Deferred from `plans/stage-14-mobile-session-simplification.md`.
Scope: `apps/mobile`, likely `back-end` (session status)

## Problem Statement

There is no way to leave a workout without ending it. `usePreventRemove`
intercepts every exit from the session screen and offers exactly one path
forward: "Cancel Workout — Your progress will be lost."

The gestures that land a user in that dialog are ordinary and often accidental:
iOS edge-swipe, Android hardware back. The dialog does the right thing by
asking, but the only answers are "keep going" and "destroy it".

Real sessions are interrupted — a phone call, a friend at the gym, needing to
check something in another screen. The app's own information architecture invites
it: `WorkoutSessionExerciseDetail` is a push onto the same stack, so the user is
one back-gesture away from the dialog the whole time they are reading form notes.

## Why this needs a decision first

The word "pause" hides at least three products:

1. **Leave and resume** — navigate away, session stays `in_progress`, a banner
   or dashboard card offers "Resume workout". Elapsed time keeps running from
   `performed_at`. Cheapest; matches how the clock already works.
2. **True pause** — elapsed time stops accumulating. Requires the server to
   store paused intervals, or a `paused_at` + accumulated-duration pair. The
   session clock derives from `performed_at` alone
   (`WorkoutSessionScreen.tsx:91`), so this is a data-model change, not a UI one.
3. **Minimized session** — a persistent floating bar across the whole app while
   a session is live, tap to return. Largest surface: every screen gains a
   layout constraint.

These also differ in what happens to an abandoned session — a workout left
`in_progress` for three days needs an answer (auto-complete? auto-cancel? ask on
next open?), and today nothing produces one.

## Current behaviour worth preserving

- The intercept itself is right. Do not let a back-gesture silently end a
  workout, whichever option is added.
- `isCleanExitRef` correctly distinguishes intentional exits (finish, cancel)
  from intercepted ones. A resume path is a third kind of clean exit and should
  reuse it.
- Sets are persisted individually as they are logged, so the data for resuming
  already exists. This is a navigation and status problem, not a persistence one.

## Sketch, if option 1 is chosen

- Session dialog gains a third action: **Leave for now**, which sets
  `isCleanExitRef` and dispatches the intercepted action without calling
  `cancelSession`
- Dashboard shows the live session — `sessions/today` already exists as a query
  key (`useApi.ts`, invalidated by `useCancelSession` and
  `useConfirmDraftSession`) — as a "Resume workout" card
- No back-end change if elapsed time is allowed to keep running

## Out of scope

- offline support for a resumed session
- notifying the user that a session is still open

## Open questions

- Which of the three products above?
- Does elapsed time keep running while away? (Answering "no" makes this a
  back-end story.)
- What happens to a session left open overnight?
