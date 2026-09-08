# Architecture: Findings from the depth review not yet specced

Status: needs-decision
Origin: monorepo depth review, 2026-09-03. Holding file for findings that did not
warrant a spec of their own at the time.
Scope: various

## Purpose

Everything below was found and verified during the 2026-09-03 review but was not
filed as its own spec, either because it is small, because it needs a decision
nobody has made, or because it is doc rot rather than code. **This is a holding
file, not a work item.** Promote an entry to its own numbered spec when someone
picks it up; delete the entry from here when they do.

Kept because the alternative is losing it — these were established once, at
cost, and none of them are discoverable by grep.

---

## 1. `apps/web` has no toast mechanism at all

`0014` and `0026` both need one to surface a mutation failure, and both are
blocked on it for their error-surfacing half.

There is no `MutationCache` / `QueryCache` `onError` in `App.tsx` or
`index.tsx`. `apps/web/src/components/EmailVerificationPage.tsx:70` comments
*"Other errors surface via global mutation cache toast"* — **that toast does not
exist.**

Silent `console.error` catches per file: `useWorkoutSessionState.ts` 9,
`WorkoutPreviewPage.tsx` 5, `EditWorkoutPageWrapper.tsx` 3,
`ProgramDashboard.tsx` / `ProgramControls.tsx` / `DashboardPage.tsx` 2 each — 23
in total. The only user-visible failure messaging in the whole web session flow
is two bare `alert()` calls at `useWorkoutSessionState.ts:330` and `:463`.

Mobile has `src/lib/toast.ts` + `ToastHost.tsx` and a structural guard
(`workout-session-failures-surfaced.test.ts`) enforcing `docs/specs/0002`. Web
has neither. **This is the single most likely thing to block 0014 and 0026 —
consider filing it first.**

Note `lib/toast.ts` on mobile is itself untested: a module-level mutable array
plus a `Set` of listeners, with `showToast` scheduling a bare `setTimeout`
(`:22`) that is never cleared.

## 2. Option tables duplicated 8× and already diverging

Goals, experience, duration and training days each exist as a local array in
four web files and four mobile files.

Web: `ProfilePage.tsx:22-28,98-103,513-515`, `GenerateWorkoutPage.tsx:25`,
`dashboard/ProgramControls.tsx:10-16,18-23,25-29`,
`onboarding/TrainingPreferencesStep.tsx:8,82`,
`onboarding/FitnessGoalsStep.tsx:32`.

Mobile: `DashboardScreen.tsx:61-85` (keys in the opposite order),
`ProfileScreen.tsx:55-68`, `OnboardingScreen.tsx:34-66` (plus separate
`GOAL_LABELS`/`EXPERIENCE_LABELS` maps at `:55-66` for the *same* enums),
`GenerateWorkoutScreen.tsx:26-32`, `RegeneratePlanModal.tsx`.

**Already visibly divergent:** experience reads `"Beginner (0-1 years)"` in
`ProfilePage.tsx:513` and `TrainingPreferencesStep.tsx:82`, but `"Beginner"` in
`ProgramControls.tsx:25-29`.

`packages/shared/src/constants/trainingStyles.ts` shows the pattern for fixing
this exists and was not extended to the other four enums.

## 3. `getWeeklyGoalMessage` — duplicated domain policy, not formatting

Byte-identical in `apps/mobile/src/components/progress/WeeklyProgressModal.tsx:37`
and `apps/web/src/components/WeeklyProgressModal.tsx:46`, together with
`formatVolume`, `formatVolumeFull`, `minutesToHours`, `formatIsoWeekLabel` and a
14-line identical unpacking of `metrics.weekly_progress`.

The formatters are covered by `0027`. `getWeeklyGoalMessage` is **not** — it is
goal-comparison policy plus user-facing copy ("You exceeded your N-day goal —
great week!"), which belongs with the domain, not with display. Decide where.

## 4. Duplicated components on mobile

Not covered by `0027` (formatters) or `0030` (web):

- **`ExerciseVideoPlayer`** — ~95 lines, near-byte-identical, at
  `ExerciseDetailScreen.tsx:47-142` and
  `WorkoutSessionExerciseDetailScreen.tsx:40-133`, including `AppState` re-play,
  `statusChange` logging and `ScreenOrientation.lockAsync` fullscreen handling.
- **Edit-exercise modal** — ~85 lines each, `WorkoutPreviewScreen.tsx:466-564`
  and `ManageExercisesScreen.tsx:415-500`. Same 4 fields, same
  `sanitizeDecimalText` wiring, same `parseInt(x) || 0` coercion; differ only in
  which mutation they call and that one shows `editError` inline (`0002`).
- **`MenuButton`** — ~50 lines verbatim in `SetOptionsMenu.tsx:99-151` and
  `ExerciseOptionsMenu.tsx:101-153`, with identical `StyleSheet` blocks. Web has
  a third and fourth copy (see `0030`).
- **Swipeable-row plumbing** — the `swipeableRefs` map + close-others +
  drag-closes-all pattern at `WorkoutPreviewScreen.tsx:48,319-344` and
  `ManageExercisesScreen.tsx:53,178-186,344-348`.

These are within one app, so Design Parity does not apply — this is ordinary
intra-app duplication and safe to consolidate.

## 5. The five exercise-detail derivations exist twice

`chartData`, `progressPercentage`, `recentSessions`, `current` and `best` are
implemented independently in `ExerciseDetailScreen.tsx:229-272` and
`WorkoutSessionExerciseDetailScreen.tsx:158-201`.

`progressPercentage` — `((last - first)/first) * 100`, `0` when `first === 0` — is
a genuine business calculation, duplicated and unreachable by any test. The two
screens also **look up the exercise differently**: by lowercased *name* in one
(`:152-155`), by *id* in the other (`:145-148`).

Candidate for the same treatment as `0023`, one layer out.

## 6. Screens with too many responsibilities

Not filed as a spec because "split this screen" is not actionable without a
target shape, and most of the derivation inside them moves out under `0023` /
`0027` / `0029` anyway. Re-assess after those land.

| File | Lines | Distinct responsibilities |
|---|---|---|
| `mobile/…/DashboardScreen.tsx` | 1027 | 7 — incl. 9 consecutive plan/program `useMemo`s and 3 verbatim copies of the start-session response unwrap |
| `mobile/…/PlansScreen.tsx` | 982 | 6 — 268 lines of which are a `StyleSheet` |
| `mobile/…/ProfileScreen.tsx` | 873 | 7 — incl. ~450 lines of six near-identical chip-grid selectors |
| `mobile/…/OnboardingScreen.tsx` | 722 | 6 — and it does **not** import the `OptionCard`/`DaySelector` components that exist for it |
| `web/…/ProfilePage.tsx` | 748 | 10 — incl. ~120 lines of inline focus/blur border styling on 6 inputs |
| `web/…/ExerciseDetailPage.tsx` | 675 | 6 — incl. ~95 lines of vendor-prefixed fullscreen video handling |
| `web/…/SessionDetailPage.tsx` | 615 | 9 — incl. two duration systems in one component and a **second** complete-session path |

Two concrete smaller items inside these:

- `mobile/…/ProgramDetailScreen.tsx:18-37` — `groupWorkoutsByWeek` is the one
  pure, top-level function in the whole screens directory. It is inside a `.tsx`,
  so it is outside the test glob. Moving the file it lives in, or the function,
  is a five-minute change with an immediate test.
- `mobile/…/ExerciseNavTabs.tsx:63-96` — ~30 lines of tab-centring arithmetic
  (`tabWidth` from live viewport, `tabOffset`, clamped against
  `contentWidth`/`maxOffset`) sitting in a `useEffect`, with a hand-declared
  `getItemLayout` at `:307-311` that must agree with it. Pure function of
  `(currentIndex, count, screenWidth)`.
- The nulls-last `day_of_week` sort is verbatim in `DashboardScreen.tsx:197-202`
  and `PlansScreen.tsx:101-106`, and again twice inside
  `web/…/plans/CustomPlansView.tsx:97-103,120-127`.

## 7. `setOnUnauthorized` has a mount window

Flagged out-of-scope in `0016`. `initAuth` accepts an optional `onUnauthorized`
which **neither app uses**; both instead call `setOnUnauthorized` from a
`useEffect` with a `null`-setting cleanup (`useAuth.tsx:34-39`,
`AuthContext.tsx:60-65`).

So before mount and during any unmount, a 401 clears the token
(`api.ts:89`) while `notifyUnauthorized` returns immediately (`auth.ts:32`) and
**nothing redirects**. The user is silently logged out and left on the screen.

Confirm reachability before filing — it may be unreachable in practice.

## 8. Doc rot in `apps/landing_page` — matters because agents trust these files

- **`CLAUDE.md:162-169` asserts a gap that does not exist.** *"Known gap: there
  is no `og:image`"* is **false**: `src/routes/__root.tsx:89-98` sets
  `og:image`, `og:image:type/width/height/alt` and `twitter:image`;
  `public/og-image.png` exists; and there is an **undocumented**
  `scripts/og-image/generate.py` that produces it. `README.md:82-83` repeats the
  stale claim. Neither file mentions the script.
- **`README.md:6` calls the app SSR**, contradicted by `README.md:30` and the
  whole of `CLAUDE.md` — the build is fully static and prerendered.
- **Duplicated constants with no shared owner:** `SITE_URL` at `data.ts:52` and
  `vite.config.ts:68`; `SHOT_WIDTH`/`SHOT_HEIGHT` at `data.ts:32-33` must match
  `variants` in `scripts/optimize-images.mjs:41-44`; the nav link list at
  `site-header.tsx:6-11` and `final-cta.tsx:54-58`; feature copy in
  `public/llms.txt:12-27` restating `data.ts:60-97`. All four are documented as
  manual sync duties with no check.
- **Section anchor ids are string literals** on the sections (`hero.tsx:19`,
  `features.tsx:20`, `sections.tsx:45,70`, `faq.tsx:11`). A renamed id silently
  produces a dead anchor, and `crawlLinks` cannot catch a fragment.

`CLAUDE.md` is otherwise the best-written file in the repo — which is exactly why
the two false statements are worth fixing.

## 9. `.cursorrules` rule 11's rationale is stale

> *"Required because mobile uses React 19 while web uses React 18, causing pnpm
> to create duplicate peer-dep variants…"*

**Both are `19.1.0`.** The dedupe list in `apps/web/vite.config.ts` is still
needed (the mechanism is real, and its comment names the production failure it
prevents — *"No QueryClient set"*), but the stated cause is wrong and will
mislead the next reader.

The actual drift moved to `apps/landing_page`: React `^19.2.0`, zod `^3.24.2`
against `^4.3.x` elsewhere, Tailwind `^4.2.1` against `3.4.17`, Vite `^8.1.5`
against `^5.2.0`, `lucide-react` `^0.575.0` against a pinned `0.522.0`.

**Decide:** does `apps/landing_page` stay deliberately on its own stack, or
converge? It shares no code with the other apps except `@fit-nation/legal`, so
"deliberately separate" is defensible — but it should be written down as an ADR
rather than left ambiguous, and rule 11's rationale should be corrected either
way.

## 10. `apps/mobile/src/screens/placeholders/` — 31 real screens

All 31 screens live in a directory called `placeholders`. Nothing lives outside
it except `screens/Onboarding/`. The name is load-bearing misinformation for
anyone — human or agent — navigating by directory.

A rename is a large diff of pure import churn, which is why it was not filed as
a spec. Worth doing in a single mechanical commit at a quiet moment.

## 11. Two claims from the review that were never verified

Listed so nobody treats them as established:

- `apps/web/src/components/WeeklyProgressModal.tsx:429` reportedly labels a row
  "Last Week" while printing `currentWeekVolume` — a visible mislabel. **Not
  confirmed.**
- `packages/legal`'s generated output was reported in sync with
  `content/*.md`. **Not confirmed** — `node` and `pnpm` were not on the
  reviewing environment's PATH, so `legal:check` could not be run.

Both are a one-minute check.

## Out of scope

- the Laravel back-end, which has its own `CONTEXT.md` and ADRs
- anything already covered by specs 0001-0030

## Acceptance

This file has no acceptance criteria — it is closed when every entry has either
been promoted to its own spec or deliberately dropped.
