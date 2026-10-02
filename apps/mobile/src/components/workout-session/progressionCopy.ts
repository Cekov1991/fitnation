import { formatWeight } from '@fit-nation/shared'
import type { WeightUnit } from '@fit-nation/shared'

/**
 * The words of the progression banner above the first set: where today's
 * targets came from, and the one choice it may offer. Pure, so the three
 * shapes (new exercise, tough last session, ready to go heavier) and the
 * total-reps variant are pinned by tests rather than by screenshots.
 */
export type ProgressionStatus = 'no_history' | 'below_min' | 'working' | 'ready'
export type ProgressionKind = 'new' | 'tough' | 'heavier' | 'total'
export type ProgressionTone = 'info' | 'warning' | 'success'

export interface ProgressionCopyInput {
  status: ProgressionStatus
  progressionMode: 'double_progression' | 'total_reps'
  /** Whether the exercise takes added weight at all. */
  weighted: boolean
  weightUnit: WeightUnit
  /** Today's suggested weight, already in the user's unit. */
  targetWeight: number | null
  /** The equipment step behind it (what a raise adds), null for bodyweight. */
  weightStep: number | null
  /** One step below the target, offered after a tough session; null when there is none. */
  loweredWeight: number | null
  maxTargetReps: number
  totalRepsPrevious?: number | null
  totalRepsTarget?: number | null
  /** Last session's weight on this exercise, to say exactly what a raise added. */
  previousWeight?: number | null
}

export interface ProgressionCopy {
  kind: ProgressionKind
  tone: ProgressionTone
  title: string
  body: string
  /** After a tough session: the lighter weight to use, and the current one to keep. */
  offer: { use: number; keep: number } | null
}

export function progressionCopy(i: ProgressionCopyInput): ProgressionCopy | null {
  const weight = (w: number) => `${formatWeight(w)} ${i.weightUnit}`

  if (i.progressionMode === 'total_reps' && i.status === 'working') {
    if (i.totalRepsTarget == null) return null
    return {
      kind: 'total',
      tone: 'info',
      title: 'Total reps',
      body:
        i.totalRepsPrevious != null
          ? `Nice work hitting ${i.totalRepsPrevious} total reps last time. Go for ${i.totalRepsTarget} today.`
          : `Go for ${i.totalRepsTarget} total reps this session.`,
      offer: null,
    }
  }

  switch (i.status) {
    case 'no_history':
      return {
        kind: 'new',
        tone: 'info',
        title: 'New exercise',
        body: i.weighted
          ? "We've estimated a starting weight for you. Adjust after your first set."
          : 'Give it your best effort; your targets build from this session.',
        offer: null,
      }

    case 'below_min': {
      const canLower = i.weighted && i.loweredWeight != null && i.targetWeight != null && i.targetWeight > 0
      return {
        kind: 'tough',
        tone: 'warning',
        title: 'Last session was tough',
        body: !i.weighted
          ? 'You missed your target reps. Keep pushing toward the range.'
          : canLower
            ? 'You missed your target reps. Try a lighter weight today.'
            : 'You missed your target reps. Aim for the full range today.',
        offer: canLower ? { use: i.loweredWeight!, keep: i.targetWeight! } : null,
      }
    }

    case 'ready': {
      if (!i.weighted) {
        return {
          kind: 'heavier',
          tone: 'success',
          title: 'Ready for more',
          body: `You hit ${i.maxTargetReps} reps last time. Try to beat it.`,
          offer: null,
        }
      }
      // What the raise added: the real difference when last time is known,
      // else the equipment step the server used.
      const added =
        i.targetWeight != null && i.previousWeight != null && i.targetWeight > i.previousWeight
          ? i.targetWeight - i.previousWeight
          : i.weightStep
      return {
        kind: 'heavier',
        tone: 'success',
        title: 'Ready to go heavier',
        body: added != null && added > 0
          ? `You hit all your reps last time. We've added ${weight(added)}.`
          : 'You hit all your reps last time. Time to add weight.',
        offer: null,
      }
    }

    case 'working':
    default:
      return null
  }
}
