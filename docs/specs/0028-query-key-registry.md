# Architecture: A query key registry

Status: ready-for-agent
Origin: monorepo depth review, 2026-09-03.
Scope: `packages/shared`, `apps/web`

## Problem Statement

There are 23 distinct query-key shapes and 107 `queryKey:` sites — 100 in
`packages/shared`, 7 in `apps/web`. Every one is an inline array literal. There
is no key factory, no `queryKeys` export, no `as const` tuple.

To invalidate correctly, a caller must know facts that appear in no type:

- the literal is `'sessions'`, **not** the URL segment `'workout-sessions'`
  (`api.ts:571`) and not `'session'`
- `['sessions', id]` and `['sessions', 'today']` are *sibling* branches under one
  prefix, so `invalidateQueries(['sessions'])` covers both — which is why several
  hooks invalidate both anyway, redundantly
- `['sessions', 'calendar', start, end]` is a 4-tuple whose last two elements
  must be the exact date strings `useCalendar` was given
- `['exercises', id, 'history']` is the *prefix* of
  `['exercises', id, 'history', params]`, so 3-element invalidations reach the
  4-element key **by prefix luck**, and a prefetch must structurally match the
  params object a different component will later pass

The drift this produces is already measurable and filed as **0018**: one key
invalidated against the wrong name, and one invalidated four times while
registered zero times. Those survived because nothing makes a key typo visible —
finding them required reading all 107 sites.

## The escape hatches this forces

Because keys and their semantics are undiscoverable, `apps/web` reaches around
the hooks 7 times:

- `useWorkoutSessionState.ts:136` hand-builds a `prefetchQuery` with a raw
  `exercisesApi.getExerciseHistory` call, bypassing `useExerciseHistory`
- `:434-435` does `refetchQueries` then `getQueryData` to re-derive an id the
  mutation response already contained
- `:511-519` hand-patches `['sessions','today']` to `{template: null, session: null}`,
  requiring the caller to know `TodayWorkoutResponse.data`'s exact shape — even
  though `useCancelSession` already invalidates that key
- `ProgramControls.tsx:96`, `ProgramDashboard.tsx:184`,
  `WorkoutSessionPageWrapper.tsx:28` all use `refetchQueries(['programs'])`
  rather than invalidate, because the hooks offer no way to say "await fresh
  data"

## Evidence

- 100 `queryKey:` sites in `packages/shared/src/hooks/useApi.ts`
- 7 more across `apps/web`, listed above
- `packages/shared/src/hooks/useApi.ts:102` and `:65,109,139,237` — the two dead
  keys (0018)
- `packages/shared/src/hooks/setLogMutations.ts:115,143,146` — a third file
  building session and exercise keys by hand

## Proposed change

A key module per domain concept — Workout Session, Plan, Program, Template,
Exercise, Planner, Profile, taxonomy — exposing constructors rather than
literals, typed so a wrong shape is a compile error. Express the prefix
relationships explicitly (a detail key derived from its list key) so the
"covered by prefix" facts above stop being folklore.

Land this **before 0024**, so the cache-patching primitive is written against
the registry rather than against literals that then need rewriting.

While migrating, note and remove the redundant double-invalidations the prefix
already covers.

## Out of scope

- adding `staleTime` / `select` / `retry` overrides to the hooks — related, and
  worth its own ticket
- the `.data` unwrapping convention (23 hooks `return response.data`,
  `useProfile` returns `response.user`, two return the raw response) — that is
  0025

## Acceptance

- No inline `queryKey` array literals in `packages/shared` or `apps/web`
- A misspelled or wrong-shaped key fails `tsc`
- No key is invalidated without a registration
- A test asserts the mutation-to-invalidation map for the session cluster, which
  is where the drift happened
