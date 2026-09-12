# Feature: Session Details as a summary card with collapsible exercises (mobile)

Status: in progress — on `feat/mobile/session-details-redesign` off `main`, 2026-09-12
Origin: Kiril, 2026-09-12 — two screenshots: the current Session Details screen and
the target design.
Scope: `apps/mobile`, `packages/shared` (view helpers; web keeps its page for now)

## Problem Statement

Session Details on mobile titled every session "Workout Session", spent a third
of the summary card on a Duration tile that mostly read "N/A" (most sessions
have no completion time recorded), and listed every logged set of every
exercise as its own bordered box, so a five-exercise session was a long scroll
of near-identical rows before the eye found anything. Nothing said how the
session compared with the last one, and there was no way to repeat the
workout or share it from the screen.

## Change

- **Summary card.** The workout's name (from its template, via `useTemplate`;
  "Generated workout" / "Workout session" when there is none), a status pill
  (Completed in `success`, In progress in `warning`, Cancelled muted), and the
  start as `Thursday, Sep 12 · 18:40` in the device locale (`formatDate
  'weekday'` plus the new `formatTime`). Under a hairline, three columns:
  total volume with the unit, exercises, sets — or total reps in place of
  volume when nothing was weighted. Below, when there is something to
  compare, a strip: "↑ 4% more volume than last time".
- **The comparison** (`volumeComparison` in
  `packages/shared/src/session/detailView.ts`) is this session's weighted
  volume against the `previous_sets` the server already attaches to each
  exercise, over the exercises that have both. The server picks each
  exercise's most recent *other* completed session, which for a session opened
  from history can be a later one, so a previous set only counts when it was
  logged before this session started. The wording is "than last time", not
  "than your last Push Day": the previous sets are per exercise and need not
  all come from one session of the same workout.
- **Exercises card.** "EXERCISES" as a small uppercase label, then one white
  card with a row per exercise: image, name, the sets on one line
  (`summarizeSets`: identical sets stated once, `4 × 8 @ 107.5 kg`; varying
  sets as ranges, `4 × 8–10 @ 60–80 kg`; bodyweight `3 × 12 reps`), the
  exercise's volume on the right and a chevron. Rows start collapsed; tapping
  one expands its set lines (`Set 1 · 80 kg × 8 reps · 640 kg`) and a "View
  exercise" link, which is where the tap-to-open-exercise of the old rows went.
- **Footer**, outside the scroll: **Repeat this session** starts a new session
  from the same template (the Manage Exercises start flow: preview when the
  server returns a draft, otherwise straight into the session) — hidden when
  the session has no template; **Continue session** replaces it while the
  session is still active; and a square **share** button (decision
  2026-09-12: the mock's arrow-up-right button shares) that opens the native
  share sheet with `sessionShareText`: name and date, the totals, one line per
  exercise.
- Notes keep their card. Sizes follow the app's scale (24 title, 22 name, 11
  uppercase labels), and the header is the round back button of Program
  Details with the title in `textPrimary`, as the mock shows it.

## Follow-up for the back-end

`WorkoutSession::getPreviousSetLogsForExercises` should exclude sessions
completed after the one being viewed; today "previous" means "most recent
other", so the sets shown as last time under a historical session can come
from a later date. The client guard above hides the comparison in that case
but cannot fix the `previous_sets` themselves.

## Web parity

`apps/web/src/components/SessionDetailPage.tsx` keeps its layout for now; the
helpers are in `packages/shared` so it can adopt them.

## Verification

- `tsc --noEmit`: mobile 7 errors before and after, none in the new screen;
  shared only its pre-existing `register.ts` error. `pnpm test`: 43 files,
  407 tests, 13 of them new (`detailView.test.ts`, `formatTime`).
- Pixel emulator, 2026-09-12, light and dark: a completed Legs Day opened from
  the dashboard's Day 2 chip shows its name from the template, "Saturday,
  Sep 12 · 10:21 AM", the Completed pill, "7,560 kg · 5 exercises · 17 sets",
  and one summarised row per exercise ("4 × 8 @ 107.5 kg", 3,440 kg). Tapping
  Deadlift lists its four set lines and the View exercise link; the share
  button opens the system sheet with the headline, totals and five exercise
  lines. A Push Day with no logged sets reads "0 kg · 6 exercises · 0 sets"
  and "No sets logged" per row.
- Not exercised on a device: the comparison strip (neither session had an
  earlier performance of its exercises; the logic is under test) and Repeat
  this session (it starts a real session on the account).
