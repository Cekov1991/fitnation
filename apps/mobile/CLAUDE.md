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

Read this before drawing anything that lists, cards, or rows.

### Rule 1 — reuse the component; never re-draw its markup

A screen composes components from `src/components/`. If a component exists
for the thing being drawn, use it, and pass props. If it almost fits, extend
it with a prop. Copying its JSX into a screen and adjusting a number is how
the app ended up with three thumbnail sizes and four name sizes; a guard test
now fails on that.

| You are drawing | Use |
|---|---|
| An exercise with its thumbnail, name, second line, trailing control | `components/exercises/ExerciseRow` |
| A row from an `ExerciseResource` in a FlatList (catalog, pickers) | `components/exercises/ExerciseCard` (a thin `ExerciseRow` wrapper) |
| A plain surface block | `components/ui/Card` |
| A section title | `components/ui/SectionHeader` |
| A primary / secondary action | `components/ui/Button` |
| A loading placeholder | `components/ui/SkeletonBox` |
| Empty or failed content | `components/ui/EmptyState`, `components/ui/ErrorState` |
| Confirm before destructive action | `components/ui/ConfirmDialog` |
| Drag-to-reorder list, swipe actions | `components/ui/SortableList`, `components/ui/SwipeAction` |

### Rule 2 — the exercise row is one component

`ExerciseRow` is the only place an exercise thumbnail is rendered. Its sizes
are pinned in `EXERCISE_ROW` (same file) and nowhere else:

| Token | Value |
|---|---|
| thumbnail | 56 × 56, radius 12 |
| empty thumbnail | `Dumbbell` 22 on `withAlpha(primary, 0.094)` |
| name | 14 / 700, one line |
| meta | 12, `textSecondary`, one line; may contain coloured `<Text>` segments |
| row | padding 8, gap 12, radius 16 |
| between rows | 12 (`EXERCISE_ROW.rowGap`) |

Surfaces: `card` (default, own `bgSurface`), `elevated` (nested in a card),
`plain` (parent paints it — `SortableItemSurface`, an expandable card).
Slots: `right` for a chevron / add button / drag handle / figure,
`onPressImage` when the row body belongs to a gesture.

If a design genuinely needs a different size, change `EXERCISE_ROW` so every
row moves together, and say so in the PR. Do not override it per screen.

Guard: `src/components/exercises/exercise-row-standard.test.ts` fails on an
`<Image source={{ uri: *.image }}>` outside `ExerciseRow.tsx` (the two
exercise-detail heroes are allow-listed) and on the 💪 emoji placeholder.

### Rule 3 — colours and type come from the theme

- Colours: `const { colors } = useTheme()`; never a raw hex in a screen.
  Partners re-skin `primary`/`secondary`, so brand colour must flow through
  `colors`. Tints via `withAlpha(colors.x, alpha)` from `@fit-nation/shared`.
- Content on a brand-filled surface uses `colors.textButton`, not `#fff`.
- Screen scaffold: `SafeAreaView edges={['top']}` on `colors.bgBase`; back
  button is `p-2 rounded-full` on `bgElevated` with `ArrowLeft` 22; screen
  title 24 / 700; section labels are 11–12px uppercase, letter-spaced,
  `textSecondary` or `textMuted`.
- Radii: 12 for controls and thumbnails, 16 for list rows and buttons, 24
  for summary cards and sheets.

### Adding a new shared component

Put it in `src/components/ui/` (generic) or a domain folder
(`exercises/`, `workout-session/`, `progress/`). Pin its numbers in an
exported `const` at the top, document the slots in the props interface, and
add a row to the table above so the next agent finds it.
