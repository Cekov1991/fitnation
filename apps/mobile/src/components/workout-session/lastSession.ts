import type { SetLogResource } from '@fit-nation/shared'

/**
 * The "Last session" card's numbers: each set against the rep range it was
 * aiming for, and the totals. Pure, so the verdicts are pinned by tests.
 */
export type SetVerdict = { kind: 'on' | 'below' | 'above'; label: string }

export interface LastSessionRow {
  setNumber: number
  weight: number
  reps: number
  /** Against the rep range; null for a total-reps exercise, where sets have no range. */
  verdict: SetVerdict | null
}

export interface LastSessionSummary {
  rows: LastSessionRow[]
  /** The session's date, from its first set; null when the API gave none. */
  date: string | null
  totalReps: number
  /** Σ weight × reps; null for a bodyweight exercise. */
  volume: number | null
  /** "Target 6–10 reps", "Target 50 total", or '' when nothing is known. */
  targetLabel: string
}

export interface LastSessionTargets {
  weighted: boolean
  minReps: number
  maxReps: number
  progressionMode: 'double_progression' | 'total_reps'
  totalRepsTarget?: number | null
}

export function verdictFor(reps: number, minReps: number, maxReps: number): SetVerdict {
  if (reps < minReps) return { kind: 'below', label: `−${minReps - reps} reps` }
  if (reps > maxReps) return { kind: 'above', label: `+${reps - maxReps} reps` }
  return { kind: 'on', label: 'On target' }
}

export function lastSessionSummary(sets: SetLogResource[], t: LastSessionTargets): LastSessionSummary {
  const ordered = [...sets].sort((a, b) => a.set_number - b.set_number)
  const perSetRange = t.progressionMode === 'double_progression' && t.minReps > 0 && t.maxReps >= t.minReps

  const rows = ordered.map(s => ({
    setNumber: s.set_number,
    weight: s.weight ?? 0,
    reps: s.reps,
    verdict: perSetRange ? verdictFor(s.reps, t.minReps, t.maxReps) : null,
  }))

  const totalReps = rows.reduce((sum, r) => sum + r.reps, 0)
  const volume = t.weighted ? rows.reduce((sum, r) => sum + r.weight * r.reps, 0) : null
  const targetLabel =
    t.progressionMode === 'total_reps'
      ? t.totalRepsTarget != null ? `Target ${t.totalRepsTarget} total` : ''
      : perSetRange ? `Target ${t.minReps}–${t.maxReps} reps` : ''

  return { rows, date: ordered[0]?.created_at ?? null, totalReps, volume, targetLabel }
}
