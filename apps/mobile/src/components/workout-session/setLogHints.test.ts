import { describe, expect, it } from 'vitest'
import { setLogHints } from './setLogHints'

const base = { allowWeightLogging: true, weightUnit: 'kg' as const, goalMinReps: 6, goalMaxReps: 10 }

describe('setLogHints', () => {
  it('first time: no chips, only the target note', () => {
    expect(setLogHints(base)).toEqual({
      weight: { last: null, note: null },
      reps: { last: null, note: 'Target 6–10' },
    })
  })

  it('weighted with history: one combined chip under Weight, none under Reps', () => {
    expect(setLogHints({ ...base, previousWeight: 48, previousReps: 8 })).toEqual({
      weight: { last: 'Last 48 kg × 8', note: null },
      reps: { last: null, note: 'Target 6–10' },
    })
  })

  it('weighted whose previous set recorded no weight still names the reps', () => {
    expect(setLogHints({ ...base, previousWeight: null, previousReps: 8 })).toEqual({
      weight: { last: 'Last 8 reps', note: null },
      reps: { last: null, note: 'Target 6–10' },
    })
  })

  it('with history on a bodyweight exercise: the chip sits under Reps', () => {
    expect(setLogHints({ ...base, allowWeightLogging: false, previousWeight: 0, previousReps: 12 })).toEqual({
      weight: null,
      reps: { last: 'Last 12', note: 'Target 6–10' },
    })
  })

  it('a total-reps exercise names the total', () => {
    expect(setLogHints({ ...base, totalRepsTarget: 50, allowWeightLogging: false, previousReps: 12 }).reps)
      .toEqual({ last: 'Last 12', note: 'Target 50 total' })
  })

  it('speaks the unit the person uses', () => {
    expect(setLogHints({ ...base, weightUnit: 'lbs', previousWeight: 110.5, previousReps: 8 }).weight?.last)
      .toBe('Last 110.5 lbs × 8')
  })
})
