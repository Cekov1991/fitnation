# Stage 14 — Mobile Workout Session Simplification

## Overview

Strip the live workout session screen down to one interaction model: **tap a tab
to switch exercise**. Swiping goes away, the `PagerView` goes away, the looping
video goes away, and the exercise tabs get big enough to read at a glance.

The point is not cosmetic. `PagerView` keeps 2–3 full `ExercisePage` trees
mounted at once, and a large amount of the current code exists only to keep the
native pager from breaking. Rendering exactly one page deletes that apparatus
and, as a side effect, fixes the rest timer dying on exercise switch.

**Mobile only.** `apps/web` has a parallel component set
(`WorkoutSessionPage.tsx`, its own `ExerciseNavTabs`, `ExerciseVideoCard`,
`RestTimer`) and is deliberately left alone in this stage.

## Prerequisites

- Stage 8 (workout session) and Stage 11 (session perf) complete
- Dev build running — `pnpm dev:mobile`

## Current behaviour (baseline)

With 4 exercises, `WorkoutSessionScreen.tsx:296` maps all 4 into `PagerView`, so
4 native page views exist. Full content mounts only for
`|index - currentIndex| <= 1`:

| page | what mounts |
|------|-------------|
| 0 (current) | full `ExercisePage` + `expo-video` player |
| 1 | full `ExercisePage`, video off (`isActive=false`), image only |
| 2, 3 | poster only — `<Image>` + name |

So: two full `ExercisePage` trees, each with its own `useLogSet` /
`useUpdateSet` / `useDeleteSet` / `useUpdateSessionExercise` hook set and its own
local state, plus 4 image fetches. `offscreenPageLimit={1}` double-gates what
`isNeighbor` already gates.

## Scope of dependency change

`react-native-pager-view` is imported **only** by `WorkoutSessionScreen` — it
comes out of `apps/mobile/package.json` entirely.

`expo-video` **stays**: `ExerciseDetailScreen` and
`WorkoutSessionExerciseDetailScreen` both use it. Only the in-session player is
removed; the video is still one tap away via the header's `onView`.

## Files created

### `src/components/workout-session/progress.ts`

```ts
countCompletedSlots(loggedSets, target): number
isExerciseComplete(detail): boolean
```

Single source of truth for "is this exercise done". Today the logic exists twice
and the two copies disagree — see Fixed along the way #1.

### `src/components/workout-session/ExerciseHeader.tsx`

Replaces `ExerciseVideoCard`. Compact row, no `expo-video`:

- 56px thumbnail, tap → `onView` (same target as today)
- exercise name, 2 lines
- primary muscle chip
- ⋯ menu button → `onOpenMenu`

Everything the video card owned except the player. The name, chip and menu
currently live in the video overlay (`ExerciseVideoCard.tsx:128-190`) and must
not be lost with it.

## Files deleted

- `src/components/workout-session/ExerciseVideoCard.tsx`
- `react-native-pager-view` from `apps/mobile/package.json`

## Files modified

### `src/screens/placeholders/WorkoutSessionScreen.tsx`

The bulk of the change.

**Remove**

- `PagerView` import, `pagerRef`, `offscreenPageLimit`, `isNeighbor`, the poster
  branch, the `expo-image` import — roughly 70 lines of JSX collapsing to a
  single `<ExercisePage>`
- the pre-mutation `setPage` dance in `performRemoveExercise` (:170-183). Its
  entire reason for existing — "the native PagerView breaks if its
  currently-displayed page disappears" — is gone.
- the ref apparatus at :122-134 (`currentExerciseRef`, `exerciseCountRef`,
  `removeSessionExerciseRef` and the effect that syncs them). With one page
  mounted there is no memo pressure to design around; callbacks read
  `currentExercise` directly.
- the `pagerRef.current?.setPage(...)` half of the clamp effect (:108) —
  `setCurrentIndex` alone is now sufficient

**Add**

- `restSeconds` / `restEndsAt` state at screen level, with `<RestTimer>`
  rendered between the tabs and the page content and **outside** the page's
  `ScrollView`. It survives exercise switches and stays on screen while
  scrolling. This only works with the state above the page — see Fixed along the
  way #2.
- `drafts: Record<number, { weight: string; reps: string }>` keyed by
  `session_exercise.id`, so a half-typed set survives a glance at another
  exercise
- `allDone` → `exercises.every(isExerciseComplete)` from `progress.ts`
- `onNext` handler advancing to the next *incomplete* exercise

### `src/components/workout-session/ExercisePage.tsx`

- `ExerciseVideoCard` → `ExerciseHeader`
- drop the `isActive` prop entirely (always the visible page now)
- `exerciseCount` → `canRemoveExercise: boolean`, computed by the parent
- local `showRestTimer` / `restSeconds` and the `<RestTimer>` render → replaced
  by an `onStartRest(seconds)` callback up to the screen
- `logWeight` / `logReps` → controlled props from the parent's `drafts`
- drop `memo` — it is no longer earning anything
- add the missing `Platform` guard around `KeyboardAvoidingView` — see Fixed
  along the way #3
- "Next exercise →" button at the foot of the set list, wired to `onNext`

### `src/components/workout-session/ExerciseNavTabs.tsx`

- bigger cards: 56px image, name `numberOfLines={2}`, `logged/target` plus a
  thin progress bar
- drop the `slice(0, 18)` truncation that already fights `numberOfLines`
- **`useEffect` on `currentIndex` → `scrollToIndex({ viewPosition: 0.5 })`.**
  Not optional any more: tabs are the only navigation, and today `scrollToIndex`
  fires only from the tab's own `onPress` (:157), so a programmatic index change
  (removal, clamp, auto-advance) leaves the active tab offscreen.
- import `countCompletedSlots` from `progress.ts`, delete the local copy

## Fixed along the way

These are pre-existing defects that fall out of the refactor rather than being
chased separately.

1. **Completion state disagreed with itself.** `WorkoutSessionScreen`'s
   `allDone` counts `logged_sets.length >= target`; `ExerciseNavTabs`'
   `countCompletedSlots` counts only slots `1..target` that have a matching
   `set_number`. The two diverge once `target_sets` shrinks — a tab could read
   "2/3" while the FINISH WORKOUT footer appeared. One shared helper, one answer.
2. **The rest timer died on exercise switch.** Timer state lives in
   `ExercisePage`, so today swiping 2+ pages away unmounts it and the countdown
   is lost. One-page-at-a-time would make that happen on *every* switch, so the
   state is hoisted to the screen and the timer made sticky.
3. **Stale `KeyboardAvoidingView` guard.** `ExercisePage.tsx:~265` carries the
   comment "On Android the OS handles keyboard insets via adjustResize; KAV adds
   a redundant layout pass that causes double-jank" — but the component wraps
   unconditionally with no `Platform` check. Restored while in the file.
4. **Double-gated offscreen rendering** — `offscreenPageLimit={1}` layered on
   top of the manual `isNeighbor` check. Both gone.
5. **Double truncation in the tabs** — `numberOfLines={1}` and
   `slice(0, 18)` fighting each other, so long names got an ellipsis from
   whichever won first.
6. **Typed set input was lost on switch** (new `drafts` map). Not previously
   reported, but it becomes far more reachable once tabs are the only nav.

## Explicitly NOT fixed

Known issues left alone, each written up as its own spec so nobody reads this
stage as having addressed them. Work them after stage 14 ships.

| spec | issue | status |
|------|-------|--------|
| [0002](../docs/specs/0002-surface-workout-mutation-failures.md) | 13 mutation failures swallowed into `console.error` — a set logged on dropping wifi fails silently | ready-for-agent |
| [0003](../docs/specs/0003-optimistic-set-logging.md) | `useLogSet` has no optimistic update, unlike its `useUpdateSet` / `useDeleteSet` siblings | ready-for-agent |
| [0004](../docs/specs/0004-pause-and-resume-a-workout.md) | Backing out destroys the session — no pause / leave-and-resume | needs-decision |
| [0005](../docs/specs/0005-orphaned-set-logs-above-target.md) | Logs with `set_number > target_sets` render nowhere, so the session screen disagrees with the summary | needs-decision |
| [0006](../docs/specs/0006-set-removal-splits-invariant-across-two-requests.md) | Set removal is two requests with no compensation, plus a compounding optimistic decrement that converges by luck | ready-for-agent |
| [0007](../docs/specs/0007-default-target-autopatch-never-retries.md) | `autoFixedSessionExerciseIds` records attempts not successes, never retries, never clears | ready-for-agent |
| [0008](../docs/specs/0008-blank-set-log-silently-substitutes-defaults.md) | Empty inputs silently log the placeholders — or, when `defaultReps` is 0, do nothing at all | ready-for-agent |
| [0009](../docs/specs/0009-finish-flow-incomplete-warning-and-notes.md) | Finish never warns about unlogged sets; the `notes` field is supported end-to-end and never sent | ready-for-agent |
| [0010](../docs/specs/0010-rpe-and-to-failure-capture.md) | No RPE / to-failure capture — needs a migration, no effort column exists | needs-decision |
| [0011](../docs/specs/0011-web-session-simplification-parity.md) | `apps/web` carries a parallel session implementation and will diverge once this ships | blocked on stage 14 |

Two of these interact with stage 14 and are worth reading before starting:

- **0007** — this stage makes the guard *more* load-bearing, not less. Its
  comment blames "PagerView remounts"; with one page mounted, `ExercisePage`
  remounts on every tab switch. Do not delete it as pager cleanup.
- **0005** — this stage makes the session screen and the nav tabs agree with each
  other. It does not make either agree with the summary, because both are bounded
  by `target_sets` and the summary is not.
- **0011** — if the shared completion helper is wanted on web, `progress.ts`
  belongs in `packages/shared/src/utils/` rather than where this stage puts it.

## Work order

1. `progress.ts`
2. `ExerciseHeader.tsx`
3. `ExercisePage.tsx` — header swap, prop changes, timer and draft state lifted out
4. `WorkoutSessionScreen.tsx` — pager removal, state hoisting
5. `ExerciseNavTabs.tsx` — sizing, auto-scroll, shared helper
6. Delete `ExerciseVideoCard.tsx`, drop `react-native-pager-view`

## Verification

- remove an exercise while on the last tab → index clamps, no blank page
- start a rest timer → switch exercise → return → still counting
- type a weight → switch exercise → return → value still there
- log the final set of the final exercise → FINISH WORKOUT footer appears, and
  every tab reads complete
- finish / cancel / hardware-back intercept all behave as before
- `pnpm --filter mobile exec tsc --noEmit`
