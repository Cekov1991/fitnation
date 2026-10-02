import { describe, expect, it } from 'vitest'
import type { SetLogResource } from '@fit-nation/shared'
import { lastSessionSummary, verdictFor } from './lastSession'

const set = (n: number, weight: number, reps: number): SetLogResource => ({
  id: n, workout_session_id: 9, workout_session_exercise_id: 1, exercise_id: 1,
  set_number: n, weight, reps, rest_seconds: null, created_at: '2026-09-28T17:05:00Z', updated_at: '2026-09-28T17:05:00Z',
})
const weighted = { weighted: true, minReps: 6, maxReps: 10, progressionMode: 'double_progression' as const }

describe('verdictFor', () => {
  it('judges a set against the rep range', () => {
    expect(verdictFor(6, 6, 10)).toEqual({ kind: 'on', label: 'On target' })
    expect(verdictFor(10, 6, 10)).toEqual({ kind: 'on', label: 'On target' })
    expect(verdictFor(3, 6, 10)).toEqual({ kind: 'below', label: '−3 reps' })
    expect(verdictFor(12, 6, 10)).toEqual({ kind: 'above', label: '+2 reps' })
  })
})

describe('lastSessionSummary', () => {
  it('lists the sets in order with their verdicts, and totals them', () => {
    const s = lastSessionSummary([set(2, 62.5, 3), set(1, 62.5, 6), set(4, 62.5, 2), set(3, 62.5, 3)], weighted)
    expect(s.rows.map(r => [r.setNumber, r.reps, r.verdict?.label])).toEqual([
      [1, 6, 'On target'], [2, 3, '−3 reps'], [3, 3, '−3 reps'], [4, 2, '−4 reps'],
    ])
    expect(s.totalReps).toBe(14)
    expect(s.volume).toBe(875)
    expect(s.targetLabel).toBe('Target 6–10 reps')
    expect(s.date).toBe('2026-09-28T17:05:00Z')
  })

  it('a bodyweight exercise has no volume', () => {
    const s = lastSessionSummary([set(1, 0, 12)], { ...weighted, weighted: false })
    expect(s.volume).toBeNull()
    expect(s.rows[0].verdict?.label).toBe('+2 reps')
  })

  it('a total-reps exercise judges nothing per set and names the total target', () => {
    const s = lastSessionSummary([set(1, 0, 20), set(2, 0, 18)], { ...weighted, weighted: false, progressionMode: 'total_reps', totalRepsTarget: 50 })
    expect(s.rows.every(r => r.verdict === null)).toBe(true)
    expect(s.totalReps).toBe(38)
    expect(s.targetLabel).toBe('Target 50 total')
  })

  it('without a usable range there is no target label and no verdicts', () => {
    const s = lastSessionSummary([set(1, 40, 8)], { ...weighted, minReps: 0, maxReps: 0 })
    expect(s.targetLabel).toBe('')
    expect(s.rows[0].verdict).toBeNull()
  })

  it('no sets: an empty summary', () => {
    expect(lastSessionSummary([], weighted)).toEqual({ rows: [], date: null, totalReps: 0, volume: 0, targetLabel: 'Target 6–10 reps' })
  })
})
