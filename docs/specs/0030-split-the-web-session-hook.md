# Architecture: Split the web session hook's 52-member interface

Status: blocked
Origin: monorepo depth review, 2026-09-03.
Scope: `apps/web`
Blocked on: 0023 (read model) and 0026 (orchestrations)

## Problem Statement

`apps/web/src/components/workout-session/hooks/useWorkoutSessionState.ts` is 610
lines. Its interface is declared in full at `:22-103` and returned verbatim at
`:528-609`: **52 members, an 82-line declared interface over a 505-line
implementation.** A caller learns nearly as much as the module hides, which is
the definition of shallow.

- **14 `useState` cells** plus 3 refs. **Eight of the fifteen are modal-open
  booleans** — presentation state sharing one object with the Workout Session's
  domain state.
- **9 mutation hooks** and **13 `mutateAsync` call sites**, the most of any file
  in `apps/web`.
- **Three of its four effects are index-repair machinery**, including one that
  detects a newly-added exercise by comparing array lengths against a ref
  (`:210-217`) and one that applies an initial index exactly once, guarded by
  another ref (`:190-199`).
- `setTimeout(() => setCurrentExerciseIndex(i+1), 500)` at `:241` with **no
  cleanup**, so unmounting mid-advance leaks a state write.

### The pass-through

The 52 members are forwarded field by field. `WorkoutSessionPage.tsx` (158
lines) destructures nothing and hands `state.*` into three children;
`WorkoutDialogs.tsx:7-39` **re-declares 32 of them** as its own prop interface
and does nothing but pass them to four children.

Apply the deletion test to `WorkoutDialogs.tsx`: delete it and the complexity
does not reappear anywhere — it moves up one level. It is a pass-through with a
39-line interface.

### The rest timer has three owners

1. `isRestTimerActive` + `restTimerSeconds` — `useWorkoutSessionState.ts:166-167`
2. `timeRemaining` + `isComplete` — `hooks/useRestTimer.ts:18-19`
3. `totalSeconds`, the progress-ring denominator — a **third** copy in
   `RestTimer.tsx:15`, kept in sync by two effects

`ExerciseContent.tsx:137-147` renders `<RestTimer>` outside the keyed content
*"to persist across exercise switches"*, which works — but `restTimerSeconds` is
only ever written from the *starting* exercise's `restSeconds`, while the timer
button's visibility reads the *current* exercise's. **After a switch, two
different rest values are live at once.**

Also: **web never auto-starts the rest timer.** `handleDidIt` does not touch it;
the only trigger is the manual button. Mobile starts it inside `handleLog`. That
is a behaviour gap, not just an architecture one — see `docs/specs/0011` item 2.

## Dead surface to remove in the same pass

- `WorkoutSessionPage.tsx:12` — a `workoutName` prop the destructure omits,
  computed by a `useMemo` in `WorkoutSessionPageWrapper.tsx:16-21` that nothing
  reads
- `WorkoutSessionPage.tsx:102` — `isAddSetLoading={false}` hardcoded, making
  `SetsList.tsx:172-178` unreachable
- `WorkoutOptionsMenu.tsx` — 132 lines, zero render sites
- `useRestTimer` returns `reset` and `isComplete`; `RestTimer.tsx:14`
  destructures neither, so **nothing fires on rest completion on web**
- `types.ts:30` — `history` declared, set to `[]` with `// Leave empty as requested`
- three identical private `MenuButton` components, ~40 lines each, in
  `ExerciseOptionsMenu.tsx:100`, `SetOptionsMenu.tsx:100`,
  `WorkoutOptionsMenu.tsx:98`

(0020 covers deleting these.)

## Why this is blocked, not merely later

Most of the 505 lines are derivation that 0023 removes and orchestration that
0026 removes. Splitting first would carve up logic that is about to move, then
require carving it again. Doing it after, the remainder divides cleanly:

- the Session read model (from 0023)
- exercise navigation state
- the rest timer, with **one** owner
- per-dialog local state, which belongs in the dialogs

## Evidence

- `useWorkoutSessionState.ts:22-103` — the declared interface
- `useWorkoutSessionState.ts:528-609` — the returned object
- `useWorkoutSessionState.ts:148-170` — the state cells
- `useWorkoutSessionState.ts:190-217` — the index-repair effects
- `WorkoutDialogs.tsx:7-39` — the 32-prop pass-through
- `ExerciseContent.tsx:137-147`, `RestTimer.tsx:15`, `useRestTimer.ts:18-19` —
  the three timer owners

## Out of scope

- porting mobile's tabs/pager or video decisions — `docs/specs/0011` decides
  those on web's own terms
- shared components with mobile — Design Parity, and 0011

## Acceptance

- No component receives more than it uses; `WorkoutDialogs` is gone or owns real
  state
- The rest timer has one owner and one duration, correct after an exercise switch
- Something fires on rest completion
- The `setTimeout` state write is cleaned up on unmount
- The remaining hook is testable without nine mocked mutations
