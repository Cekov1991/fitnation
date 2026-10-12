import { describe, expect, it } from 'vitest'
import { setLogHints } from './setLogHints'

const base = { allowWeightLogging: true, weightUnit: 'kg' as const, goalMinReps: 6, goalMaxReps: 10, defaultWeight: 57.5, defaultReps: 6 }

describe('setLogHints', () => {
  it('first time: no chips; the estimated weight and the target as notes', () => {
    expect(setLogHints(base)).toEqual({
      weight: { last: null, note: 'Suggested 57.5 kg' },
      reps: { last: null, note: 'Target 6–10' },
    })
  })

  it('first time on a bodyweight exercise: the target alone', () => {
    expect(setLogHints({ ...base, allowWeightLogging: false, defaultWeight: 0 })).toEqual({
      weight: null,
      reps: { last: null, note: 'Target 6–10' },
    })
  })

  it('with history: a Last chip under each field, the suggestion only when it differs', () => {
    expect(setLogHints({ ...base, previousWeight: 57.5, previousReps: 8 })).toEqual({
      weight: { last: 'Last 57.5 kg', note: null },
      reps: { last: 'Last 8', note: 'Target 6–10' },
    })
    expect(setLogHints({ ...base, defaultWeight: 60, previousWeight: 57.5, previousReps: 8 }).weight)
      .toEqual({ last: 'Last 57.5 kg', note: 'Suggested 60 kg' })
  })

  it('with history on a bodyweight exercise: reps only', () => {
    expect(setLogHints({ ...base, allowWeightLogging: false, defaultWeight: 0, previousWeight: 0, previousReps: 12 })).toEqual({
      weight: null,
      reps: { last: 'Last 12', note: 'Target 6–10' },
    })
  })

  it('a total-reps exercise names the total', () => {
    expect(setLogHints({ ...base, totalRepsTarget: 50, allowWeightLogging: false, defaultWeight: 0, previousWeight: 0, previousReps: 12 }).reps)
      .toEqual({ last: 'Last 12', note: 'Target 50 total' })
  })

  it('speaks the unit the person uses', () => {
    expect(setLogHints({ ...base, weightUnit: 'lbs', defaultWeight: 125 }).weight?.note).toBe('Suggested 125 lbs')
  })
})
