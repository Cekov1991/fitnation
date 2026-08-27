# Spec: A blank set log silently substitutes defaults, or does nothing

Status: ready-for-agent
Origin: workout session screen review, 2026-08-27. Deferred from `plans/stage-14-mobile-session-simplification.md`.
Scope: `apps/mobile`

## Problem Statement

`handleLog` treats empty inputs as consent to log the placeholder values:

```ts
const reps = parseInt(logReps || '', 10)
const weight = allowWeightLogging ? parseFloat(logWeight || '') || defaultWeight : 0
const repsToLog = isNaN(reps) || reps <= 0 ? defaultReps : reps
if (repsToLog <= 0) return
```

Two bad outcomes fall out of this.

**Silent substitution.** Tap **Log Set** with both fields empty and the app
records `defaultWeight × defaultReps` as if the user had entered them. The
placeholders show those numbers greyed out, so the intent is arguably "the
placeholder is the suggestion, accept it by tapping" — but nothing tells the
user that a tap commits them, and a greyed number reads as absent, not as
pre-filled. The user finds out what was logged after it is logged.

**Silent no-op.** If `defaultReps` is 0 — no previous session and `minReps`
falsy — `repsToLog` is 0, the guard returns, and the tap does *nothing at all*.
No toast, no validation message, no visual response beyond the press state. The
button appears broken.

`defaultReps` is `prevActiveSet?.reps ?? (minReps > 0 ? minReps : 0)`, and
`minReps` falls back to `DEFAULT_MIN_REPS` (8), so the zero case needs
`min_target_reps` to be explicitly 0 rather than null. Reachable via the preview
screen's Edit Exercise modal, which accepts 0 (`parseInt(editMinReps) || 0`) with
no lower bound.

## Evidence

- `src/components/workout-session/ExercisePage.tsx` — `handleLog`, the
  substitution and the bare `return`
- `src/components/workout-session/SetLogCard.tsx` — `placeholder={defaultReps > 0 ? defaultReps.toString() : '0'}`,
  so the zero case renders a literal `0` placeholder above a button that does
  nothing
- `src/screens/placeholders/WorkoutPreviewScreen.tsx` — `handleSaveEdit` writes
  `min_target_reps: parseInt(editMinReps) || 0` with no floor

## Proposed change

Decide explicitly whether tapping with empty fields is a commit or a mistake,
then make the UI say so. Recommendation — treat it as a commit, because it is
genuinely convenient when the suggestion is right, but stop it being silent:

- Make the substitution visible *before* the tap. Prefill the inputs with the
  default values as real text on mount rather than as placeholders, so the user
  sees and can edit exactly what will be logged. This removes the ambiguity
  rather than explaining it.
- Replace the bare `return` with a validation toast:
  `Enter the reps you completed.` The button must never do nothing.
- Give the preview modal a floor of 1 on min reps, max reps and sets, so 0
  cannot be persisted in the first place.

If prefilling is unwanted (it changes the feel of the card), the fallback is to
keep placeholders and label them — a `Suggested` chip already exists for weight
in `SetLogCard` and could cover reps too — but the no-op must still be fixed.

## Out of scope

- server-side validation of reps (the API already rejects nonsense)
- rest-timer behaviour

## Acceptance

- With `min_target_reps = 0` and no history, tapping **Log Set** produces a
  visible message and never a silent no-op
- What the app logs from an untouched card is visible on the card before the tap
- The preview Edit Exercise modal cannot save 0 sets, 0 min reps or 0 max reps
