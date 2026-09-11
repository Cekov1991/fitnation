# Feature: Exercise filters as two dropdowns (mobile)

Status: in progress — on `feat/mobile/exercise-filter-dropdowns` off `main`, 2026-09-11
Origin: Kiril, 2026-09-11 — two screenshots: the current Exercises tab with two
scrolling chip rows, and the target with a Muscle and an Equipment dropdown.
Scope: `apps/mobile` (web keeps its chips, see below)

## Problem Statement

Every exercise list on mobile — the Exercises tab, Add/Swap Exercise on a
template (`ExercisePicker`, reached from Manage Exercises) and Add/Swap
Exercise on a session (`WorkoutPreviewExercisePicker`, reached from the
workout preview and the live session) — filters with horizontally scrolling
chip rows: one for muscle groups, one for equipment. On a phone most of the
chips are off-screen, so the user cannot see what is chosen without scrolling
the row, nor how many exercises are left. The chips also only list the
muscles and equipment present in the current search result, so a muscle
preselected by a swap can have no visible chip until the list has loaded. The
session picker never got the equipment row at all. The filtering logic itself
is copied into all three screens.

## Change

Under the search bar, in place of the chip rows:

- **Two dropdowns side by side**, `Muscle` and `Equipment`, each a surface
  card with the caption in 11 dp uppercase muted grey, the current value in
  16 dp semibold ("All" by default) and a chevron — the same type scale the
  Customize Plan sheet uses for its rows. While a value other than All is
  chosen the card fills with the brand colour and its text turns to
  `textButton`. Tapping opens the existing `OptionSheet` (a check on the
  current choice, one pick closes it) listing All plus the options.
- **A summary line** under them: "24 exercises" (or "1 exercise") on the left
  once the list has loaded, and on the right, only while a dropdown is set,
  **Clear filter** (plural when both are) in the brand colour. It resets the
  two dropdowns; the search field keeps its own Clear, as on the web.
- The options are the **full taxonomy** (`useMuscleGroups`, `useEquipmentTypes`
  by `display_order`), not the subset present in the current result, so the
  dropdowns are always visible and a swap's preselected muscle shows at once.
  A choice with no matches lands on the existing empty state, whose "Clear
  filters" resets search and both dropdowns.
- The swap flows keep preselecting the outgoing exercise's primary muscle
  (`swapMuscleGroupId`); it now shows as the filled Muscle card.
- The **session picker gains the Equipment dropdown** it never had, and its
  empty state gets the same "Clear filters" link as the other two.

Files:

- `src/lib/exerciseFilters.ts` (new) — `ExerciseFilterState`, `filterExercises`,
  `matchesFilters` (muscle matches on primary muscle groups only, equipment on
  its code — exactly the rule the chips applied), `exerciseCountLabel`;
  covered by `exerciseFilters.test.ts`.
- `src/components/exercises/FilterSelect.tsx` (new) — one labelled dropdown
  over `OptionSheet`.
- `src/components/exercises/ExerciseFilters.tsx` (new) — the two dropdowns
  and the summary line; takes the taxonomy, the state and the result count.
- `ExerciseCatalogScreen`, `ExercisePickerScreen`,
  `WorkoutPreviewExercisePickerScreen` — swap the chip rows and the three
  copies of the filter logic for the component and the module.
- `src/components/exercises/FilterChips.tsx` — deleted, no callers left.
  (`src/components/ui/FilterChip.tsx`, the pill over `ActionSheet`, has had no
  callers since 0035 and is left alone here.)

## Web parity

`apps/web/src/components/ExercisePickerPage.tsx` keeps its chip rows (which
already list the full taxonomy and have a Clear Filters button). Decision
pending: mobile only for now.

## Verification

- `tsc --noEmit` for mobile: 7 errors before and after, none in the touched
  files (the one in `ExercisePickerScreen` — `target_sets` not in
  `AddTemplateExerciseInput` — predates this change); `pnpm typecheck:ci`
  ratchet: no new errors. `pnpm test`: 42 files, 394 tests, 8 of them new.
- Pixel emulator, 2026-09-11, light and dark: Exercises tab — Equipment →
  Barbell fills the card, "14 exercises", Clear filter appears; Muscle → Chest
  on top gives "2 exercises" and "Clear filters"; the link resets both to All
  and hides itself at "138 exercises". Dashboard → pencil → Manage Exercises →
  Add Exercise shows the block unfiltered; swipe → Swap arrives with the
  Muscle card filled (Glutes, 31 exercises, Clear filter). Dark mode renders
  the active card in the partner's dark primary with `textButton` text.
- Not exercised on a device: the session picker
  (`WorkoutPreviewExercisePickerScreen`), reached only from a workout preview
  or a live session — starting one writes a session to the account. It shares
  `ExerciseFilters` and the filter module with the two verified screens.
