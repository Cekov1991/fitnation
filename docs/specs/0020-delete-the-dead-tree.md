# Architecture: Delete the dead tree

Status: ready-for-agent
Origin: monorepo depth review, 2026-09-03.
Scope: `apps/web`, `apps/landing_page`, repo root

## Problem Statement

The repo carries a substantial amount of code and config that nothing reaches.
Applying the deletion test: nothing here concentrates complexity, so deleting it
removes complexity outright. This is the cheapest available improvement to
navigability, and it should happen **before** the refactors in 0023-0030 so
nobody works from a shadow copy.

### Byte-identical dead duplicates in `apps/web/src/utils/`

`calendarWeek.ts`, `repRange.ts` and `workoutHelpers.ts` are `diff`-identical to
their `packages/shared/src/utils/` originals and have **zero importers** — every
consumer already imports from `@fit-nation/shared`. Extraction residue. The
shared original's own comment warns about *"duplicate `getWeekStart` logic
drifting apart"*, which is exactly what these are one edit away from becoming.

### 45 of 46 files in `apps/landing_page/src/components/ui/`

Only `accordion.tsx` is imported from outside that directory (by
`components/landing/faq.tsx:6`). The remaining 4,310 lines form a closed
subgraph importing only each other; `sidebar.tsx` (744) and `chart.tsx` (331),
the app's two largest files, have zero inbound edges.

That subgraph is the sole reason for these dependencies: `recharts`,
`react-hook-form`, `@hookform/resolvers`, `zod`, `sonner`, `cmdk`,
`embla-carousel-react`, `vaul`, `date-fns`, `input-otp`, `react-day-picker`,
`react-resizable-panels`, `class-variance-authority`, and 26 `@radix-ui/*`
packages. It also owns the app's entire lint noise floor — `CLAUDE.md` records
*"6 pre-existing react-refresh warnings from shadcn boilerplate; 0 errors is the
bar"*.

Also dead in that app: `src/hooks/use-mobile.tsx` (reachable only from
`sidebar.tsx`), `src/lib/error-page.ts` and `src/start.ts` (a CSRF middleware
guarding server functions that cannot exist in a fully static build), and the
`--color-chart-*` / `--color-sidebar-*` token blocks plus the whole `.dark {}`
block in `src/styles.css`.

### Root-level decoys

- **`app.json`** — a second Expo config declaring `com.fitnation.fitnation`,
  while the real `apps/mobile/app.json` declares `com.fitnation.app`. Two
  configs, conflicting bundle ids.
- **`apps/web/eas.json`** — an empty file. EAS is Expo's build service; web is
  Vite.
- **`vercel.json`** — duplicates `apps/web/vercel.json`. Its only remaining
  function is to be a hazard the landing page's docs warn about twice.
- **`README.md`** — still the Magic Patterns Vite template, telling a newcomer to
  run `npm install && npm run dev` in a five-workspace pnpm monorepo.
- **`scripts/`** and **`public/icons`** — empty.

### Dead surface in `apps/web`

- `components/workout-session/WorkoutOptionsMenu.tsx` — 132 lines, zero render
  sites
- `AddWorkoutPage.tsx:352-416` — a 65-line day picker commented out, while
  `selectDay`, `occupiedDays`, `clickedOccupiedDay` and the `DAYS_OF_WEEK` import
  all remain live. `DAY_NAMES` is also redeclared locally despite
  `constants/index.ts:9` exporting it
- `WorkoutSessionPage.tsx:12` — a `workoutName` prop that the destructure omits,
  computed by a `useMemo` in `WorkoutSessionPageWrapper.tsx:16-21` that nothing
  reads
- `WorkoutSessionPage.tsx:102` — `isAddSetLoading={false}` hardcoded, making the
  branch at `SetsList.tsx:172-178` unreachable
- `types.ts:30` — a `history` field set to `[]` with the comment
  `// Leave empty as requested`

## Proposed change

Delete, in three separate commits so each is independently revertable:

1. **Source deletions** — the three `apps/web/src/utils/` files, the 45 landing
   `ui/` files plus `use-mobile.tsx` / `error-page.ts` / `start.ts`,
   `WorkoutOptionsMenu.tsx`, the commented-out day picker and its orphaned
   helpers, and the dead web session surface.
2. **Config deletions** — root `app.json`, `apps/web/eas.json`, root
   `vercel.json`, root `scripts/`, `public/icons`. Rewrite root `README.md` as a
   real monorepo readme.
3. **Dependency removal** — the landing packages listed above, plus the dead
   token blocks in `styles.css`.

## Verification note — do not trust a green build

`apps/landing_page/CLAUDE.md` is explicit that `pnpm build` *"exits 0 with a
broken page"*. After step 3, serve `dist/client` and confirm `/` is roughly 36KB
rather than 2KB, and that `/privacy` and `/terms` still render. Prerendered HTML
contains a NUL byte, so use `grep -a`.

## Out of scope

- `src/assets/originals/` in the landing page — imported by nothing, but they are
  the masters the WebP derivatives are generated from. Keep.
- the `QueryClient` provider in the landing page — dead at runtime, but it exists
  because `vite.config.ts` needs the package in `resolve.dedupe`. Establish
  whether removing the provider is safe before touching it.

## Acceptance

- `grep` for `getWeekStartMonday`, `formatRepRange` or `estimateWorkoutDuration`
  returns one definition each
- `apps/landing_page` builds, and `/`, `/privacy`, `/terms` render from
  `dist/client`
- Lint on `apps/landing_page` reports 0 warnings, not 6
- One Expo config in the repo
- Root `README.md` describes this monorepo
