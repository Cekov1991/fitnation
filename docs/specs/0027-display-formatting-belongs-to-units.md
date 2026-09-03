# Architecture: Display formatting belongs to the Unit System module

Status: ready-for-agent
Origin: monorepo depth review, 2026-09-03. Extends `docs/specs/0001`.
Scope: `packages/shared`, `apps/mobile`, `apps/web`

## Problem Statement

`packages/shared/src/index.ts:36` describes the units module as *"the single
owner of everything that follows from a Unit System"*. For display, it is not.

| Rule | Copies | Agree? |
|---|---|---|
| `formatWeight` | 5 | **No** — web rounds to 1dp first, the 4 mobile copies do not |
| `formatDuration` | 5 | **No** — 4 signatures; null renders `'N/A'` or `''` |
| `formatDate` | 5 | **No** — 3 formats |
| mm:ss elapsed | 4 | **No** — only mobile's clock has an hours branch |
| volume | 4 | **No** — different bases (see 0023) |
| delta sign prefix | 4 | identical, uncoordinated |

Concrete user-visible consequence: **the same exercise chart is labelled
`08-27` on one mobile screen and `Aug 27` on the other**, because
`ExerciseDetailScreen.tsx:235` uses `point.date.slice(5)` while
`WorkoutSessionExerciseDetailScreen.tsx` calls its local `formatDateForDisplay`.

## The test that already constrains this cannot reach it

`packages/shared/src/units/fixed-point.test.ts:59-65` is titled *"a display
formatter must not be used on a writable value"* and demonstrates that
`Math.round(w*10)/10` turns `82.55` into `82.5`.

That expression is verbatim `apps/web/.../workout-session/utils.ts:14`.

The test models the transformation by hand — `throughWebNumberInput` — **because
there is no real function to import**. The rule is pinned in a package that
cannot see any of the five implementations.

## Evidence

- `formatWeight`: mobile `SetLogCard.tsx:31`, `SetRow.tsx:34`,
  `SessionDetailScreen.tsx:33`, `WorkoutSummaryScreen.tsx:23`; web
  `workout-session/utils.ts:11`
- `formatDuration`: mobile `SessionDetailScreen.tsx:21`, `ProgressScreen.tsx:48`,
  `WorkoutSummaryScreen.tsx:15` (takes two ISO strings, not minutes); web
  `SessionDetailPage.tsx:24`, `WeeklyCalendar.tsx:40`
- `formatDate`: mobile `ExerciseDetailScreen.tsx:38`,
  `WorkoutSessionExerciseDetailScreen.tsx:28`, `SessionDetailScreen.tsx:15`,
  `ProgressScreen.tsx:43`; web `SessionDetailPage.tsx:18`,
  `ExerciseDetailPage.tsx:21`
- mm:ss: mobile `RestTimer.tsx:30`, `SessionClock.tsx:10`; web
  `useRestTimer.ts:76`, `useWorkoutTimer.ts:24`
- `packages/shared/src/units/index.ts:8-11` — the comment describing the
  eighteen-component drift this module was created to end
- `packages/shared/src/units/no-client-conversion.test.ts` — the fence

## Non-uses worth catching in the same pass

Several sites render a weight with **no** formatter at all:
`ExercisePage.tsx:503,513,533` (weight and volume raw),
`WorkoutPreviewScreen.tsx:443` (`target_weight` raw),
`ManageExercisesScreen.tsx:281`.

## Proposed change

Move weight, duration, date, volume and delta-sign display into the units
module, alongside the labels, bounds and input steps it already owns. Delete the
local copies rather than leaving them — the three dead files in
`apps/web/src/utils/` (see 0020) are what copying produced last time.

Where the copies disagree, pick deliberately and write the choice down:

- `formatDuration(null)` → one answer, not `'N/A'` and `''`
- `formatDate` → one format per context, and the two exercise charts must match
- `formatWeight` → resolve the rounding difference against
  `fixed-point.test.ts`'s rule: display formatters must not round a value that
  can be written back

Then extend `no-client-conversion.test.ts` to cover the new surface. That fence
is currently 6 regexes over 3 directories — it would miss `* 0.45359237` or
`lbsToKilos`, and it does not scan `apps/landing_page` at all.

## Why this is the recommended first refactor

It is pure functions, no cache, no async, no state, and the test already exists
and currently fakes its subject. It establishes the move-and-test habit the rest
of 0023-0030 depends on, at the lowest possible risk.

## Out of scope

- unit *conversion*, which is deliberately server-side
  (`back-end/docs/adr/0001`)
- the volume *base* disagreement — that is 0023

## Acceptance

- One implementation of each formatter in the repo
- `fixed-point.test.ts` imports the real function instead of simulating it
- Both exercise charts label their axis identically
- No weight rendered without a formatter
- `no-client-conversion.test.ts` covers display formatters and scans all four
  source roots
