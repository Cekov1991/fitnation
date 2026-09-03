# Architecture: A Workout Session read model in `packages/shared`

Status: needs-decision
Origin: monorepo depth review, 2026-09-03. Extends `docs/specs/0011`.
Scope: `packages/shared`, `apps/mobile`, `apps/web`
Blocked on: the `target_sets` decision in `docs/specs/0005`

## Problem Statement

"What is the user looking at?" is the central question of the Workout Session,
and both apps answer it independently.

The slot model — build `1..target_sets`, fill each slot from `logged_sets` by
matching `set_number` — is a `useMemo` inside a 562-line React Native component
on mobile and a loop inside a 96-line mapper on web:

```ts
// apps/mobile/.../ExercisePage.tsx:95-110
Array.from({ length: targetSets }, (_, i) => {
  const n = i + 1
  const log = logged_sets.find(l => l.set_number === n)
  ...
})
```

```ts
// apps/web/.../workout-session/utils.ts:33-53
for (let i = 0; i < targetSets; i++) {
  const loggedSet = loggedSets.find(s => s.set_number === i + 1);
  ...
}
```

`progress.ts` already extracted the *counting* half of this rule on mobile — so
the same invariant lives twice on mobile alone.

Everything downstream duplicates behind it:

- **Completion** — 7 spellings across the two apps, in 3 different rules. One of
  them (`WeeklyCalendar.tsx:93`) weights a partial day at 50%.
- **Volume totals** — 4 derivations that **disagree on their base**. Mobile's
  summary sums `logged_sets.length`; web's sums completed slots. So a Set Log
  above `target_sets` is counted by one and invisible to the other.
- **The bodyweight rule** — 4 owners, disagreeing about TRX (see 0015).
- **Pending-row prefill** — already divergent: mobile looks up one
  `previous_sets` row for the active slot, web looks up a row **per slot** and
  carries a `progressionMode === 'total_reps' ? 0 : minTargetReps` branch that
  mobile has no equivalent of.

## What is already decided, and what is not

`docs/specs/0011:51-55` asks for this by name:

> **Shared completion helper.** ... Note `progress.ts` lands in `apps/mobile` in
> stage 14 — if web needs it, it belongs in `packages/shared/src/utils/` instead,
> and stage 14's copy should move there rather than being duplicated.

`docs/specs/0011` also rules **out of scope** unifying the two session
implementations into shared components, and `.cursorrules` treats Design Parity
as non-negotiable. This spec shares *derivation*, not components. Nothing here
proposes a shared React component.

**The blocking decision is `docs/specs/0005`:** is `target_sets` a floor or a
cap? The read model's shape depends on it — whether the slot list is bounded by
`target_sets` or by `max(target_sets, highestLoggedSetNumber)`. 0005 recommends
floor, which loses no user data and makes the session screen agree with the
summary. Settle 0005 before building.

## The deepest thing to preserve

`progress.ts:3-16` records why the server's own `is_completed` is deliberately
unused: it disagrees for orphaned logs, and it does not move with optimistic
cache updates during a live session. That reasoning currently protects one of
the eight call sites that need it. Carry the comment across.

## Evidence

- `apps/mobile/.../ExercisePage.tsx:85-116` — slots, defaults, prefill
- `apps/mobile/.../progress.ts` + `progress.test.ts` — the counting half, tested
- `apps/mobile/.../WorkoutSessionScreen.tsx:221,368` — `nextIndex`, `allDone`
- `apps/mobile/.../ExerciseNavTabs.tsx:104,147` — per-tab completion
- `apps/mobile/.../SessionDetailScreen.tsx:71-83` — totals, in the render body
- `apps/mobile/.../WorkoutSummaryScreen.tsx:37-57` — totals, different partition
- `apps/web/.../workout-session/utils.ts:18-95` — `mapSessionToExercises`,
  `getExerciseCompletionStatus`
- `apps/web/.../useWorkoutSessionState.ts:174,185` — `completedSetsCount`,
  `allExercisesCompleted`
- `apps/web/.../ExerciseContent.tsx:125` — a fourth inline completion spelling
- `apps/web/.../WorkoutSummaryScreen.tsx:28-65` — `calculateStats`
- `apps/web/.../SessionDetailPage.tsx:75-101` — totals from `logged_sets`

## Proposed change

One module in `packages/shared` taking a session payload and returning the
reconciled Session Exercises: slots with their completed/pending state and
prefill values, per-exercise and per-session totals, the completion predicate,
the weight-logging rule, and the target/rep defaults.

Both apps then render a model rather than deriving one. Move `progress.ts` here
rather than copying it, per 0011.

Sequence: land 0024 first, so `target_sets` has a single writer before this
derives from it.

## Out of scope

- shared React components (0011, `.cursorrules` Design Parity)
- the orphaned-log *decision* itself — that is 0005; this spec consumes it
- `apps/web`'s `Exercise`/`Set` remapped domain model, which can keep its own
  shape as a thin adapter over the read model if that is less disruptive

## Acceptance

- One definition of a slot, a completion, and a session total in the repo
- Mobile's summary and web's summary report identical numbers for the same
  session, including one with a log above `target_sets`
- Pending-row prefill is identical on both platforms
- `progress.test.ts` moves with `progress.ts` and still passes
- New tests cover the 0005 decision, the orphan case, and the prefill divergence
