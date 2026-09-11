# Feature: One place to customise the personalised plan (mobile)

Status: done — on `feat/mobile/adjust-plan-modal` (stacked on `feat/mobile/replace-draggable-flatlist`); Refresh Plan itself not exercised on a device, it rebuilds the real plan
Origin: Kiril, 2026-09-11 — "all the configuration should live inside the modal".
Scope: `apps/mobile` (web keeps its controls for now, see below)

## Problem Statement

The programs tab of the dashboard carried a horizontally scrolling row of
controls: a calendar button, four dropdown chips (goal, experience, days per
week, workout duration) and a Refresh button. Each chip saved its value to the
profile the moment it was picked, without regenerating anything; Refresh opened
a modal holding two more choices (equipment, training style) and only then
rebuilt the plan. The settings that shape the plan were split across two
places with two different saving behaviours, and the row did not fit on a
phone without scrolling.

## Change

- **Dashboard, programs tab.** The header is a row: a 56 dp logo tile on the
  left, partner name and welcome beside it. Under the tabs sits one plan card
  with the same 24 dp corners as the workout card: plan name on the left,
  "Week n/m" on the right, this week's day chips inside the card (a `card`
  variant of `WorkoutTemplateSelector`: light tint, 12 dp corners, no outer
  padding), and a footer bar split by a hairline with **Overview** (opens the
  program's week timeline; was the bare calendar icon) and **Customize**
  (opens the sheet). The four dropdown chips and the Refresh button are gone.
- `src/components/ui/AdjustPlanSheet.tsx` (replaces `RegeneratePlanModal.tsx`)
  is a full-height bottom sheet on `@gorhom/bottom-sheet` (pure JS over
  Reanimated and gesture-handler; `BottomSheetModalProvider` mounted in
  `App.tsx`). It slides up in about 420 ms with an ease-out to just under the
  status bar. The grabber and the title form the drag handle, so a downward
  drag closes it only from there; dragging the settings does nothing
  (`enableContentPanningGesture` off). Cancel and the Android back button close
  it too. Title "Customize Your Plan"; rows: Goal, Experience (with the years
  hint), Days per week as an inline row of seven squares with the chosen number
  echoed on the right, Workout duration, Equipment (chosen names or "Any
  equipment", plus a hint line), Training style (one choice; it was a
  multi-choice before, decision 2026-09-11). Each row opens a picker. The
  footer — the note "This will replace the N workouts in <plan>." (plus "Your
  progress in it starts over." when any are completed), the primary **Refresh
  Plan** button and Cancel — renders through the library's footer slot, which
  is positioned from the sheet's animated position, so it never jumps while
  the content height settles during the slide-in.
- `src/components/ui/OptionSheet.tsx` (new) — the picker: a bottom card
  listing options with a check on the current one(s); single choice closes on
  pick, multi choice (equipment) toggles until Done. A native Modal, so it
  sits above the sheet.
- Nothing is saved until Refresh Plan. The dashboard then saves the four
  settings to the profile — only if any changed, since the server builds the
  plan from the stored profile and not from the request — and regenerates the
  plan. Closing the sheet discards every change.
- A failure keeps the sheet open with the choices intact and shows the error
  in place of the note; a toast would be hidden under the sheet. Before, the
  failure was a bare `console.error`.
- Sizes follow the app's own scale (22 title, 16 values, 11 uppercase labels
  in the muted grey), not the design mock's, which renders one step larger.
- Gotcha kept in a comment: after a swipe-dismiss the library has already
  unmounted the sheet; calling `dismiss()` again leaves it deaf to the next
  `present()`. The sheet tracks whether it is presented and only acts on real
  transitions.

## Web parity

`apps/web/src/components/dashboard/ProgramControls.tsx` still has the four
`<select>`s that save on change, plus Refresh Program and its two-choice modal.
Decision 2026-09-11: mobile only for now; the web follows when its dashboard is
next touched.

## Verification

- `tsc --noEmit` for mobile: no errors in the touched files; `pnpm typecheck:ci`
  ratchet: no new errors. `pnpm test`: 376/376.
- Device (Pixel 9 Pro XL emulator, 2026-09-11): open → swipe down → reopen →
  back key → reopen → Cancel → reopen → swipe down, all correct; the Goal
  picker and the multi-select Equipment picker update their rows; a drag on
  the settings leaves the sheet open, a drag on the header closes it. Frame
  capture: the footer sits at its final position from the first frame of the
  slide-in, which takes 0.42 s. Refresh Plan itself was not exercised, it
  rebuilds the real plan.
