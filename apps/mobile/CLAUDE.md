# Fit Nation mobile

Expo (React Native 0.81) app. NativeWind 4 for utility classes, `StyleSheet`
where a component owns its numbers, `expo-image` for pictures,
`lucide-react-native` for icons, TanStack Query hooks from
`@fit-nation/shared`. Screens live in `src/screens/placeholders/` (the name is
historical; they are the real screens).

## Commands

```bash
pnpm --filter mobile start      # Expo dev server
pnpm --filter mobile typecheck  # tsc --noEmit (has a known-error baseline: root `pnpm typecheck:ci`)
pnpm test                       # vitest, from the repo root; collects apps/**/*.test.ts
```

## UI standards

Read this before drawing anything. Every rule here has a guard test
(`src/components/ui/ui-standards.test.ts`, `src/components/exercises/exercise-row-standard.test.ts`)
that fails on the hand-rolled version, so a screen that ignores it does not
pass `pnpm test`.

### Rule 1 — reuse the component; never re-draw its markup

A screen composes components from `src/components/`. If a component exists
for the thing being drawn, use it and pass props. If it almost fits, extend
it with a prop. Copying its JSX into a screen and adjusting a number is how
the app ended up with three thumbnail sizes, four title sizes and seven
spellings of the same caption.

| You are drawing | Use |
|---|---|
| Stacked-screen header: back button + title (+ subtitle, trailing slot) | `ui/ScreenHeader` |
| Tab-root page title (Plans, Progress, Profile, catalog) | `ui/ScreenHeader` → `PageTitle` |
| Any tappable pill of text: CTA, Save, Cancel, Continue, Delete | `ui/Button` (`variant`, `size`, `icon`, `loading`) |
| Small-caps caption over a group or under a stat | `ui/SectionLabel` |
| Larger heading with an inline action ("See all") | `ui/SectionHeader` |
| A load that failed | `ui/ErrorState` (`onRetry`) |
| Nothing to show — full page, or in the flow of a list | `ui/EmptyState` (`variant="page" \| "card"`) |
| An exercise with its thumbnail, name, second line, trailing control | `exercises/ExerciseRow` |
| A row from an `ExerciseResource` in a FlatList | `exercises/ExerciseCard` (thin `ExerciseRow` wrapper) |
| A surface block in a stack | `ui/Card` |
| The headline card of a screen, an auth form, a notes card (radius 24, hairline border) | `ui/Card variant="summary"` |
| Loading placeholder | `ui/SkeletonBox` |
| Confirm before a destructive action | `ui/ConfirmDialog` |
| Drag-to-reorder list, swipe actions | `ui/SortableList`, `ui/SwipeAction` |

### Rule 2 — numbers live in tokens, not in screens

| Token | Where | Values |
|---|---|---|
| `SCREEN` | `constants/layout.ts` | gutter `paddingX` 16; `paddingTop` 16; `paddingBottom` 24, or `paddingBottomWithFooter` 120 under a pinned CTA |
| `RADIUS` | `constants/layout.ts` | `control` 12 (inputs, chips, thumbnails, sm buttons), `row` 16 (list rows, md buttons), `card` 24 (summary cards, sheets, dialogs), `pill` 999 |
| `STACK_GAP` / `SECTION_GAP` | `constants/layout.ts` | 12 between cards in a list, 24 between sections |
| `BUTTON` | `ui/Button.tsx` | md: py 16, text 16/700, radius 16 · sm: py 10, text 14/700, radius 12 |
| `HEADER` | `ui/ScreenHeader.tsx` | title 24/700 `textPrimary`; back = `ArrowLeft` 22 `textSecondary` in a `bgElevated` pill; page title 30/700 `primary` |
| `SECTION_LABEL` | `ui/SectionLabel.tsx` | 12/700, letter-spacing 1, uppercase, `textSecondary` (`tone="muted"` inside cards), mb 12 |
| `EXERCISE_ROW` | `exercises/ExerciseRow.tsx` | thumb 56 r12; name 14/700; meta 12; padding 8; gap 12; radius 16; row gap 12 |

A screen's scroll content is `contentContainerStyle={{ paddingHorizontal: SCREEN.paddingX, paddingBottom: SCREEN.paddingBottom }}`.
A screen never writes `paddingHorizontal: 24`, `px-6`, `rounded-2xl py-4`, `borderRadius: 24`, `border-dashed`, `text-2xl font-bold` next to an arrow, or `uppercase tracking-wider`.

If a design genuinely needs a different number, change the token so every
instance moves together, and say so in the PR.

### Rule 3 — every colour is a theme token

`const { colors } = useTheme()`. Partners re-skin `primary`/`secondary` and the
app has a dark theme, so a literal colour is wrong in both directions.

| Need | Token |
|---|---|
| Text/icon on a brand-filled surface (button, selected chip) | `colors.textButton` — never `'#fff'` or `text-white` |
| Text/icon over a cover photo | `colors.textOnImage` |
| Darkening over a cover photo | `colors.imageScrim` |
| Backdrop behind a sheet / dialog / modal | `colors.scrim` |
| Full-screen media viewer background | `colors.mediaBackdrop` |
| Good / bad / caution / neutral-info (charts, badges, deltas) | `colors.success` / `colors.error` / `colors.warning` / `colors.info` |
| A tint of any of the above | `withAlpha(colors.x, 0.15)` from `@fit-nation/shared` |

Allowed literals, each for a stated reason: `constants/theme.ts`; `error-boundary.tsx`
(renders when the theme provider may have crashed); `SocialAuthButtons.tsx` (Google's
mark); `PlanGeneratingOverlay.tsx` (a deliberate dark scene with its own palette);
`shadowColor: '#000'`.

### Button variants

| Variant | Look | For |
|---|---|---|
| `primary` | brand gradient, `textButton` | the screen's main action: Start Workout, Save, Continue |
| `accent` | solid `secondary` | a main action that resumes something in progress: Continue Workout |
| `secondary` | `bgSurface` + hairline border, `textPrimary` | Regenerate, Repeat this session, dialog Cancel |
| `ghost` | text only | Skip, a Cancel under a primary |
| `destructive` | outlined `error` | Cancel Workout, Delete, Remove |
| `dashed` | dashed brand outline, taller | the "Add …" tile at the end of a list |
| `onBrand` | solid `textButton` fill, brand text | the main action on a brand-gradient card: Log Set, Save |
| `onBrandGhost` | translucent `textButton` fill | the secondary action on a brand card: Cancel, Generate Smart Workout |

Labels are Title Case ("Start Workout", "Save Changes", "Back to Sign In"), never
shouted ("START WORKOUT"). A retry is `ErrorState`'s "Try Again"; a screen never
writes its own "Retry". Two buttons side by side: `size="sm"` in a `flex-row gap-3`,
each `style={{ flex: 1 }}`.

`icon` leads, `iconRight` trails (a chevron on a row-like button). Icon-only
controls (a timer button, a close X) and segment chips are not `Button`. The one
allow-listed dashed tile is the plan carousel's card-shaped "Create New".

### Headers, states and captions — the cases that came up

- A header with an icon or action beside the title: pass it as `right`. A picker
  that closes with an X: `ScreenHeader` with the X in `right` and no `onBack`. A
  wizard step (onboarding): a ghost `Button label="Back"` beside the progress bar,
  no title. Dashboard's partner-logo block is a brand header, not a `PageTitle`.
- Loading and error branches render the same `ScreenHeader` as the loaded screen.
  When the name is not loaded yet, title it with the noun ("Workout", "Session").
- Errors: `ErrorState` fills the area under the header; `onRetry` only when a refetch
  exists, otherwise a `secondary` sm "Go Back". The plan-building error leaves the
  dark scene and renders `ErrorState` on `bgBase`.
- Empty states: title is a short noun phrase ("No exercises", "Nothing logged yet"),
  the sentence goes in `description`, "Clear Filters" is the `action`. Fallback body
  copy ("This routine has no description yet.") is not an empty state — keep it a
  sentence and do not start it with "No …", which the guard reads as a hand-rolled one.
- `SectionLabel` takes `color` for a caption that carries a status or brand colour
  (a status chip, the plan name on a brand card) and `numberOfLines`; `style` is
  for margins. A `ChevronLeft` paired with `ChevronRight` in a pager is fine; only
  `ArrowLeft` is reserved for `ScreenHeader`.
- Scroll bottom padding is `SCREEN.paddingBottom` (24) or, under a pinned footer,
  `SCREEN.paddingBottomWithFooter` (120). The old 36/40 values were drift.
- A file that uses `StyleSheet.create` keeps its static numbers there and applies
  theme colours inline: `style={[styles.row, { color: colors.textSecondary }]}`. A
  module-scope colour table becomes a function of `colors: AppColors`.

### Adding a new shared component

Put it in `src/components/ui/` (generic) or a domain folder
(`exercises/`, `workout-session/`, `progress/`). Pin its numbers in an
exported `const` at the top, document the slots in the props interface, add a
row to the table in Rule 1, and if screens must not re-draw it, add a rule to
`ui-standards.test.ts`.
