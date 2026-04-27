# Stage 11 — Workout Session Performance & UX Pass

## Overview

Goal: **smooth workout UX on mid-range Android** (and great behavior on iOS),
especially during live sessions: horizontal paging between exercises, header
clock, rest timer, tabs, and set logging.

Stage 10 established **dev builds** so native modules are allowed. This stage
owns **all workout-session UI performance**: native pager, fewer React
re-renders, UI-thread timers/animations where it matters, and optional tab /
input polish.

**Prerequisite:** Stage 10 complete (or equivalent: `expo run:ios` /
`expo run:android` works; Metro documented).

---

## Problem statement (current state)

- `WorkoutSessionScreen` uses a horizontal **`ScrollView` + `pagingEnabled`**
  fallback instead of `react-native-pager-view`. Android paging feels worse
  than iOS.
- The session **clock** updates via `setInterval` → `setState` every second,
  which re-renders the screen subtree (header, tabs, all mounted pages).
- `ExercisePage` nests a vertical `ScrollView`, images, gradients, and SVGs;
  `ExerciseNavTabs` uses per-tab gradients and thumbnails. Together with
  frequent parent re-renders, this shows as jank on slower devices.
- `RestTimer` ticks on an interval with React state and SVG updates — same
  pattern as the header clock.

Dependencies already in `apps/mobile/package.json` that support the fix:
`react-native-reanimated`, `react-native-gesture-handler`,
`react-native-worklets`, `expo-image`.

---

## Part 1 — Native pager (`react-native-pager-view`)

Dev builds only (not Expo Go).

### Steps

1. Add dependency:

   ```bash
   cd apps/mobile
   pnpm add react-native-pager-view
   ```

   On iOS: `cd ios && pod install && cd ..` (or let `expo run:ios` run pods).

2. In `WorkoutSessionScreen.tsx`, follow existing **`TODO: PAGER_VIEW`**
   markers (or remove them once done):

   - Import `PagerView`.
   - Remove horizontal `ScrollView` pager imports (`Dimensions`,
     `NativeScrollEvent`, `NativeSyntheticEvent`, etc.) and
     `handleMomentumScrollEnd`.
   - `useRef<PagerView>(null)`, `goToPage` calls `pagerRef.current?.setPage(idx)`.
   - Replace the horizontal `ScrollView` block with `PagerView`; wrap each
     page in `<View style={{ flex: 1 }} key={…}>`.
   - Keep props aligned with current `ExercisePage` (`onView`, `onSwap`,
     `onRemoveExercise`, `exerciseCount`, `isRemoveExerciseLoading`, etc.).

3. **Rebuild** the native app after adding the module.

### Android tuning (optional)

- Consider `offscreenPageLimit={1}` so only neighbors mount heavy content.
- Tune `overdrag` if the default feel is too loose.

### Smoke tests

- Swipe between exercises; tabs stay in sync.
- Tap tabs; pager jumps or animates to the correct page.
- Rotation / width changes behave (native pager vs fixed `SCREEN_WIDTH`).

### Acceptance

- [ ] `react-native-pager-view` in `package.json`.
- [ ] No `TODO: PAGER_VIEW` left in `WorkoutSessionScreen.tsx`.
- [ ] Swipe + tab navigation verified on a physical Android device.

---

## Part 2 — Zero (or minimal) React re-renders for the clock

**Principle:** ticking UI should not call `setState` on the whole screen every
second.

### Approach

- Drive **elapsed seconds** with a Reanimated **`SharedValue`** updated on the
  UI thread (`useFrameCallback`, or a bridge-friendly timer that only writes to
  the SV — pick one pattern and stick to it).
- Render header time with **`react-native-reanimated`** text (`ReText` from
  `react-native-reanimated` if available in your version, or
  `useAnimatedProps` on a non-editable `TextInput`, or a tiny dedicated
  component that subscribes only to the SV).
- Keep `startTimeRef` / `performed_at` logic; only the **display path** moves
  off React state for the tick.

### Acceptance

- [ ] Profiling / logging: parent screen does **not** re-render once per second
      solely for the clock (optional: React DevTools or a debug render counter).

---

## Part 3 — Rest timer on the UI thread

`RestTimer` currently uses `setInterval` + `useState` for remaining time and
animates SVG `strokeDashoffset` from JS-derived props.

### Approach

- Model end time as a **timestamp**; derive `remaining` in a worklet or update
  a `SharedValue` on the UI thread.
- Animate the ring with **`useAnimatedProps`** on the SVG `Circle` (or simplify
  to a Reanimated-driven progress bar if SVG proves heavy).

### Acceptance

- [ ] Rest countdown does not force full-screen re-renders every 500ms.
- [ ] Skip / complete / ±15s still behave correctly; AppState resume still
      corrects remaining time.

---

## Part 4 — Lazy pages + memoization

### Lazy mount

- Only mount full **`ExercisePage`** for current index ± 1 (or use
  `PagerView`’s `offscreenPageLimit` + lightweight placeholders for far pages
  if you need stricter control).
- Avoid mounting video / heavy hero for pages the user has not opened yet if
  measurable win.

### Memoization

- `React.memo` on **`ExercisePage`**, **`ExerciseNavTabs`** row children, set
  rows (`CompletedSetRow`, `PendingSetRow`, `SetLogCard`, `SetEditCard`) with
  stable callbacks from the parent (`useCallback` / store actions).
- Ensure `goToPage` and navigation handlers do not change identity every render
  unless data really changed.

### Acceptance

- [ ] Swiping with many exercises does not linearly degrade FPS from mounting
      N full pages at once (verify on Android).

---

## Part 5 — Exercise tabs: list + cheaper chrome

- Prefer horizontal **`FlatList`** for tabs with `getItemLayout` /
  `keyExtractor` / memoized `renderItem`.
- Reduce **per-tab `LinearGradient`** on Android if profiling shows cost;
  active state can use a solid + border or a single animated underline
  (`SharedValue` for scroll position or active index).

### Acceptance

- [ ] Tab strip scrolls smoothly with 10+ exercises; no obvious hitch when
      switching exercises.

---

## Part 6 — Navigation & background work

- Use **`react-native-screens`** options where applicable: e.g.
  `freezeOnBlur`, `detachInactiveScreens` on the stack that hosts the workout
  so sibling screens do not keep updating in the background.
- Audit **AppState** listeners — keep them minimal on this screen.

### Acceptance

- [ ] Leaving the workout screen (e.g. detail route) does not leave expensive
      subscriptions running unintentionally.

---

## Part 7 — Optional (larger UX change)

- **Uncontrolled inputs** + refs for weight/reps, or a shared bottom-sheet
  numeric keypad (Reanimated) to avoid `KeyboardAvoidingView` layout thrash on
  Android.
- Split **UI-only state** (active index, rest visibility) into a tiny store
  (Zustand) or narrow contexts so children do not re-render when unrelated
  session fields update.

---

## Acceptance criteria (stage complete)

- [ ] Part 1: `PagerView` integrated; smoke tests pass.
- [ ] Part 2: Session clock does not drive whole-screen React re-renders every
      second.
- [ ] Part 3: Rest timer animation path reviewed; no unnecessary full-tree
      churn during countdown.
- [ ] Part 4: Memoization + lazy/offscreen strategy documented and verified on
      a mid-range Android device (e.g. Galaxy A-series).
- [ ] Part 5: Tab strip performant with many exercises.
- [ ] Part 6: Screen lifecycle / stack options considered and applied where
      appropriate.

---

## References

- [react-native-pager-view](https://github.com/callstack/react-native-pager-view)
- [Reanimated](https://docs.swmansion.com/react-native-reanimated/)
- [React Native Screens](https://github.com/software-mansion/react-native-screens)
- [Stage 10 — Native build](./stage-10-native-build-migration.md)
- [Stage 8 — Workout session](./stage-8-workout-session.md)
- Primary files:
  - `apps/mobile/src/screens/placeholders/WorkoutSessionScreen.tsx`
  - `apps/mobile/src/components/workout-session/ExercisePage.tsx`
  - `apps/mobile/src/components/workout-session/ExerciseNavTabs.tsx`
  - `apps/mobile/src/components/workout-session/RestTimer.tsx`
