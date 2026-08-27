# Spec: Finish flow — warn on incomplete sets, and use the notes field

Status: ready-for-agent
Origin: workout session screen review, 2026-08-27. Deferred from `plans/stage-14-mobile-session-simplification.md`.
Scope: `apps/mobile`

## Problem Statement

Two small gaps at the end of a workout.

**The finish confirmation is uniform regardless of state.** Whether the user has
logged every set or two of fifteen, the dialog reads *"Finish Workout? Are you
sure you want to end this session?"* — nothing distinguishes finishing a
completed workout from abandoning one halfway. A mis-tap on **Finish** in the
header, which sits next to the clock and is reachable at any moment, ends the
session with a generic prompt that gives the user no reason to look twice.

**The notes field exists on both ends and is never used.** The server accepts and
stores it; the mutation hook takes it; the UI never sends one. There is no way to
record "left shoulder felt off" or "gym was packed, cut it short" — the context
that makes a session's numbers interpretable weeks later.

## Evidence

- `src/screens/placeholders/WorkoutSessionScreen.tsx` — the finish `ConfirmDialog`,
  a fixed title and message
- `packages/shared/src/hooks/useApi.ts:748` —
  `useCompleteSession` signature is `{ sessionId: number; notes?: string }`
- `WorkoutSessionScreen.tsx` — `performFinish` calls
  `completeSession.mutateAsync({ sessionId: numericSessionId })`; `notes` never
  passed
- `back-end/app/Http/Controllers/Api/WorkoutSessionController.php:254-266` —
  `complete` validates `notes` as `nullable|string|max:1000` and writes it to the
  session

Both halves are already built. This is wiring plus one dialog variant.

## Proposed change

**Incomplete warning.** Stage 14 introduces `isExerciseComplete` in
`components/workout-session/progress.ts`, so the counts are already at hand. When
the session is not complete, the dialog says what is being left behind:

> **Finish Workout?**
> 4 of 12 sets logged. The rest won't be recorded.
> [Finish Anyway] [Keep Going]

When everything is logged, keep today's copy and confirm label. Same dialog
component, message and labels driven by completeness. Do not block finishing —
cutting a workout short is legitimate and common; the user just needs to know
that is what they are doing.

**Notes.** Add an optional multiline input to the finish dialog, placeholder
`How did it go? (optional)`, passed through to
`completeSession.mutateAsync({ sessionId, notes })`. Trim, and omit the field
entirely when blank so the server stores null rather than an empty string. Cap at
1000 characters to match server validation, with the limit enforced in the input
rather than surfaced as a rejection.

`ConfirmDialog` is currently message-only, so this needs either a `children`
slot on it or a purpose-built finish dialog. A `children` slot is the smaller
change and is likely to be wanted again.

Notes are already stored per session; whether they are *displayed* on
`SessionDetailScreen` is a separate question — worth checking whether that screen
already renders `notes`, and adding it there if not, otherwise this writes to a
field nobody can read.

## Out of scope

- RPE and to-failure capture (see 0010)
- per-exercise or per-set notes; this is one note per session, which is what the
  schema supports
- editing notes after the fact

## Acceptance

- Finishing with unlogged sets shows the count and a distinct confirm label;
  finishing complete shows today's copy
- A note typed in the dialog is on the session after completion and survives a
  refetch
- Blank note sends no `notes` field
- Finishing is never blocked by either change
