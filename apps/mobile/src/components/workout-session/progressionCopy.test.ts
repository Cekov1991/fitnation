import { describe, expect, it } from 'vitest'
import { progressionCopy, type ProgressionCopyInput } from './progressionCopy'

const base: ProgressionCopyInput = {
  status: 'working',
  progressionMode: 'double_progression',
  weighted: true,
  weightUnit: 'kg',
  targetWeight: 62.5,
  weightStep: 2.5,
  loweredWeight: 60,
  maxTargetReps: 12,
}

describe('progressionCopy', () => {
  it('says nothing mid-progression on a weighted exercise', () => {
    expect(progressionCopy(base)).toBeNull()
  })

  it('a new exercise explains the estimate', () => {
    expect(progressionCopy({ ...base, status: 'no_history' })).toMatchObject({
      kind: 'new',
      tone: 'info',
      title: 'New exercise',
      body: "We've estimated a starting weight for you. Adjust after your first set.",
      offer: null,
    })
    expect(progressionCopy({ ...base, status: 'no_history', weighted: false })?.body).toMatch(/best effort/)
  })

  it('a tough session offers one step down, and keeps the current weight as the alternative', () => {
    expect(progressionCopy({ ...base, status: 'below_min' })).toMatchObject({
      kind: 'tough',
      tone: 'warning',
      title: 'Last session was tough',
      body: 'You missed your target reps. Try a lighter weight today.',
      offer: { use: 60, keep: 62.5 },
    })
  })

  it('a tough session with nothing to lower, or on bodyweight, offers no choice', () => {
    expect(progressionCopy({ ...base, status: 'below_min', loweredWeight: null })).toMatchObject({
      body: 'You missed your target reps. Aim for the full range today.',
      offer: null,
    })
    expect(progressionCopy({ ...base, status: 'below_min', weighted: false })).toMatchObject({
      body: 'You missed your target reps. Keep pushing toward the range.',
      offer: null,
    })
  })

  it('ready to go heavier names what was added, from last time when known', () => {
    expect(progressionCopy({ ...base, status: 'ready', previousWeight: 60 })).toMatchObject({
      kind: 'heavier',
      tone: 'success',
      title: 'Ready to go heavier',
      body: "You hit all your reps last time. We've added 2.5 kg.",
    })
    // Without last time, the equipment step is what the server added.
    expect(progressionCopy({ ...base, status: 'ready', weightStep: 5, weightUnit: 'lbs' })?.body)
      .toBe("You hit all your reps last time. We've added 5 lbs.")
    expect(progressionCopy({ ...base, status: 'ready', weighted: false })?.body).toBe('You hit 12 reps last time. Try to beat it.')
  })

  it('total-reps exercises talk in totals, and stay quiet without a target', () => {
    const total = { ...base, progressionMode: 'total_reps' as const, totalRepsTarget: 50 }
    expect(progressionCopy({ ...total, totalRepsPrevious: 45 })).toMatchObject({
      kind: 'total',
      body: 'Nice work hitting 45 total reps last time. Go for 50 today.',
    })
    expect(progressionCopy(total)?.body).toBe('Go for 50 total reps this session.')
    expect(progressionCopy({ ...total, totalRepsTarget: null })).toBeNull()
  })
})
