import { formatWeight } from '@fit-nation/shared'
import type { WeightUnit } from '@fit-nation/shared'

/**
 * The hints under the set-log fields. The fields stay empty with placeholders
 * — a pre-filled value would have to be deleted whenever the lift goes
 * differently — so under each one a "Last …" chip says what the placeholder is
 * based on, and a plain note beside it adds the target (reps) or the plan's
 * suggestion when it differs from last time (weight).
 */
export interface SetLogHintInput {
  allowWeightLogging: boolean
  weightUnit: WeightUnit
  goalMinReps: number
  goalMaxReps: number
  /** A total-reps exercise: the count is the point, not a range per set. */
  totalRepsTarget?: number | null
  /** What the fields open with (the placeholders). */
  defaultWeight: number
  defaultReps: number
  /** Last session's set in this slot, when there was one. */
  previousWeight?: number | null
  previousReps?: number | null
}

export interface ColumnHint {
  /** The "Last …" chip; null the first time. */
  last: string | null
  /** Plain text beside the chip; null when there is nothing to add. */
  note: string | null
}

export interface SetLogHints {
  /** Under the Weight field; null when the exercise takes no weight. */
  weight: ColumnHint | null
  /** Under the Reps field. */
  reps: ColumnHint
}

export function setLogHints(i: SetLogHintInput): SetLogHints {
  const weight = (w: number) => `${formatWeight(w)} ${i.weightUnit}`
  const hasHistory = i.previousReps != null

  let weightHint: ColumnHint | null = null
  if (i.allowWeightLogging) {
    const last = hasHistory && i.previousWeight != null ? `Last ${weight(i.previousWeight)}` : null
    // The plan may suggest a heavier (or lighter) weight than last time; the
    // placeholder shows it, so name it next to what it is based on.
    const differs = i.previousWeight == null || i.defaultWeight !== i.previousWeight
    const note = i.defaultWeight > 0 && (!hasHistory || differs) ? `Suggested ${weight(i.defaultWeight)}` : null
    weightHint = { last, note }
  }

  const target = i.totalRepsTarget != null ? `Target ${i.totalRepsTarget} total` : `Target ${i.goalMinReps}–${i.goalMaxReps}`
  return {
    weight: weightHint,
    reps: { last: hasHistory ? `Last ${i.previousReps}` : null, note: target },
  }
}
