import { formatWeight } from '@fit-nation/shared'
import type { WeightUnit } from '@fit-nation/shared'

/**
 * The hint chips under the set-log steppers. The steppers open on the
 * suggestion (as a placeholder, named by the weight badge), so the hints only
 * say what happened last time. On a weighted exercise the Weight column gets
 * one combined chip — "Last 48 kg × 8", or "Last 8 reps" when the previous set
 * recorded no weight — and the Reps column keeps only the target note. On a
 * bodyweight exercise the "Last …" chip sits under Reps instead, beside the
 * target.
 */
export interface SetLogHintInput {
  allowWeightLogging: boolean
  weightUnit: WeightUnit
  goalMinReps: number
  goalMaxReps: number
  /** A total-reps exercise: the count is the point, not a range per set. */
  totalRepsTarget?: number | null
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
    // The previous set may have reps without a recorded weight; the chip then
    // still names the reps rather than vanishing.
    const last = !hasHistory
      ? null
      : i.previousWeight != null
        ? `Last ${weight(i.previousWeight)} × ${i.previousReps}`
        : `Last ${i.previousReps} reps`
    weightHint = { last, note: null }
  }

  const target = i.totalRepsTarget != null ? `Target ${i.totalRepsTarget} total` : `Target ${i.goalMinReps}–${i.goalMaxReps}`
  return {
    weight: weightHint,
    reps: {
      last: !i.allowWeightLogging && hasHistory ? `Last ${i.previousReps}` : null,
      note: target,
    },
  }
}
