# Spec: Web parity for the workout session simplification

Status: blocked
Origin: workout session screen review, 2026-08-27. Deferred from `plans/stage-14-mobile-session-simplification.md`.
Blocked on: stage 14 shipping on mobile
Scope: `apps/web`

## Problem Statement

`apps/web` carries a parallel implementation of the workout session with the same
component names and the same shape:

```
apps/web/src/components/workout-session/
  WorkoutSessionPage.tsx   ExerciseContent.tsx    ExerciseNavTabs.tsx
  ExerciseVideoCard.tsx    RestTimer.tsx          SetsList.tsx
  SetLogCard.tsx           SetEditCard.tsx        SetOptionsMenu.tsx
  ExerciseOptionsMenu.tsx  WorkoutOptionsMenu.tsx WorkoutHeader.tsx
  WorkoutDialogs.tsx       FinishWorkoutButton.tsx ProgressionBanner.tsx
  WorkoutSummaryScreen.tsx hooks/ types.ts utils.ts
```

Stage 14 deliberately scoped itself to mobile, so once it ships the two clients
diverge: mobile is tabs-only with no in-session video and a hoisted rest timer,
web keeps whatever it has. Anyone reading `ExerciseNavTabs.tsx` will find two
files with that name doing different things.

## Why this is deliberately deferred, not forgotten

The mobile changes are motivated by constraints web does not share. `PagerView`
is a native component with no web equivalent; the memory cost of several mounted
exercise pages and a looping `expo-video` player is a device concern. Web may
already be tabs-only, and a `<video>` element on a desktop browser is not the
same cost as a native player on a phone mid-workout.

So this is not a mechanical port. The first task is to establish what web
actually does today and which of the mobile changes address a real problem there.

## What to establish first

- Does web have a swipe/pager model at all, or is it already tab-switched?
- How many exercise bodies does `WorkoutSessionPage` mount at once?
- Where does web's rest timer state live — does it survive an exercise switch?
- Does web have the same completion-count divergence stage 14 fixed on mobile?
  (`ExerciseNavTabs` counting slots vs the finish button counting logs.) This one
  is a correctness bug rather than a platform trade-off, and it is the most
  likely to be worth porting regardless of the rest.

## Candidate changes, in likely order of value

1. **Shared completion helper.** If the divergence exists on web too, that is a
   real defect. Note `progress.ts` lands in `apps/mobile` in stage 14 — if web
   needs it, it belongs in `packages/shared/src/utils/` instead, and stage 14's
   copy should move there rather than being duplicated.
2. **Rest timer surviving exercise switches** — same reasoning as mobile,
   platform-independent.
3. **Tab sizing and auto-scroll-into-view** — depends on web's layout; a desktop
   viewport may show all tabs at once, making this moot.
4. **Removing the in-session video** — least likely to transfer. Decide on web's
   own terms.

## Out of scope

- unifying the two implementations into shared components. Tempting, and a much
  larger piece of work than this spec; the platforms have diverged enough that it
  needs its own design.

## Acceptance

- A written answer to each question under *What to establish first*
- Any item confirmed as a shared correctness bug is fixed on both clients, with
  the helper living in `packages/shared`
- Platform-specific items are explicitly accepted or declined in writing, so the
  divergence is a decision rather than a drift
