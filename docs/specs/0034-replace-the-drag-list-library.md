# Architecture: Replace the drag-to-reorder list on mobile

Status: done — on `feat/mobile/replace-draggable-flatlist`; the drop was checked by hand on the emulator through the afternoon, the frame capture was not repeated
Origin: the exercise list "reloads" a beat after every drag (Kiril, 2026-09-10); root cause found by frame capture the same evening.
Scope: `apps/mobile`

## Problem Statement

Reordering exercises on `ManageExercisesScreen` and `WorkoutPreviewScreen`
showed a visible flash at the moment of the drop. Recording the emulator at
full frame rate (`adb exec-out screenrecord --output-format=raw-frames`)
showed the flash is exactly one frame, about 50 ms long, painted right after
`react-native-draggable-flatlist`'s drop spring settles: every shifted row is
drawn at its new layout position plus its old drag offset, one row is pushed
off the top, one is hidden, and there is a blank gap. The next frame is
correct.

The cause is in the library, not in our data layer. On drop it reorders its
React children and clears the active item in the same commit, while each row's
translation is reset only when the row's `onLayout` fires. On the New
Architecture the frame is painted before that reset arrives. Airplane mode
reproduces it with no network at all, and the app's needless refetch after a
drop (spec 0033) is a separate, later event.

A small patch to the library (`pnpm patch`, use a zero translate once the
active item is cleared) did not remove the frame: Reanimated re-applies the
last transform it holds for each row on the React commit, so the stale value
wins regardless of what the library computes next. The library has open
flicker reports and no New Architecture fix upstream (computerjazz/
react-native-draggable-flatlist #123, #226).

## Change

- `react-native-draggable-flatlist@4.0.3` removed; `react-native-sortables@1.10.0`
  added. Pure JS on top of Reanimated 4 and gesture-handler 2, supports the New
  Architecture and Expo, no native rebuild.
- `src/components/ui/SortableList.tsx` (new) — the one drag list of the app:
  `SortableList` (an `Animated.ScrollView` with header/footer/empty slots
  around a one-column `Sortable.Grid`, auto-scroll wired, drag restricted to a
  handle, library haptics on lift/reorder/drop), `SortableHandle` (the grip),
  and `SortableItemSurface` (a row background whose colours fade to the
  "lifted" values in step with the library's own activation progress).
- `ManageExercisesScreen.tsx`, `WorkoutPreviewScreen.tsx` — the list, the row
  surface and the grip swapped for the three components above. Row spacing
  moves from a per-row margin to the list's `rowGap`. The manual haptic on
  drag start is dropped (the list provides it). `handleDragEnd` receives the
  reordered array directly and skips the network call when a row is dropped
  back into its own slot (the library hands back the same array instance).
  Everything else on the rows — swipe actions, image tap, edit modal — is
  untouched.

- `src/components/ui/SwipeAction.tsx` (new, second commit) — the buttons
  behind a swiped row. Swap and Edit sit on a neutral tint of the text colour
  with a dark icon and a short label; only Remove carries colour, a soft red
  tint with a red icon. Before, they were solid blocks of the theme's
  secondary, primary and error colours with white icons, which a partner
  palette (navy and yellow) turned into three loud blocks and an unreadable
  white-on-yellow. Brand colour stays for real calls to action.

Why this library fixes the frame: it owns every row's position in its own
animated values, keyed by item, and does not move React children to reorder.
When the screen commits the reordered data after a drop, the rows that
re-render are already where they belong, so the commit is invisible.

## Behaviour to keep in mind

- Rows are not virtualised. Fine for a workout's exercise list, wrong for
  hundreds of rows.
- The drag starts after a 200 ms hold on the grip (same as before). Other
  rows keep full opacity while one is lifted; the lifted row scales to 1.02 as
  before and now also carries the library's default soft shadow.
- On iOS with the New Architecture and gesture-handler 2.x the library
  documents a case where a screen that is detached and re-attached can leave a
  dragged item stuck (bottom tabs with `detachInactiveScreens={false}`). Both
  screens here are stack screens. gesture-handler 3 removes the case but is
  ahead of what Expo SDK 54 ships (~2.28); revisit on the next SDK upgrade.

## Verification

- `tsc --noEmit` for mobile: no errors in the touched files; `pnpm typecheck:ci`
  ratchet: no new errors. `pnpm test`: 376/376.
- Device: reordering used by hand on the Pixel 9 Pro XL emulator for the rest of the day without a visible flash; swipe actions, image tap and the picker flows unchanged. The frame capture that found the original bug was not repeated on the new list.
