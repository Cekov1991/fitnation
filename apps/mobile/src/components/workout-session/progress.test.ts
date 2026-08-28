import { describe, expect, it } from 'vitest'
import type { SessionExerciseDetail, SetLogResource } from '@fit-nation/shared'
import { countCompletedSlots, isExerciseComplete } from './progress'

function log(setNumber: number): SetLogResource {
  return {
    id: setNumber * 100,
    workout_session_id: 1,
    workout_session_exercise_id: 1,
    exercise_id: 1,
    set_number: setNumber,
    weight: 60,
    reps: 8,
    rest_seconds: 90,
    created_at: '2026-08-27T10:00:00Z',
    updated_at: '2026-08-27T10:00:00Z',
  }
}

function detail(targetSets: number | null, setNumbers: number[]): SessionExerciseDetail {
  return {
    session_exercise: { id: 1, target_sets: targetSets } as SessionExerciseDetail['session_exercise'],
    logged_sets: setNumbers.map(log),
    previous_sets: [],
    is_completed: false,
  }
}

describe('countCompletedSlots', () => {
  it('counts nothing when no sets are logged', () => {
    expect(countCompletedSlots([], 3)).toBe(0)
  })

  it('counts nothing when the target is zero', () => {
    expect(countCompletedSlots([log(1), log(2)], 0)).toBe(0)
  })

  it('treats missing logged_sets as none logged', () => {
    expect(countCompletedSlots(undefined, 3)).toBe(0)
  })

  it('counts a fully logged exercise', () => {
    expect(countCompletedSlots([log(1), log(2), log(3)], 3)).toBe(3)
  })

  it('counts only the slots that have a matching set_number', () => {
    // Slot 2 is empty — the user logged sets 1 and 3.
    expect(countCompletedSlots([log(1), log(3)], 3)).toBe(2)
  })

  // The divergence this module exists to remove: a count-based check says
  // 3 >= 3 and reports complete, while slot 2 is still visibly pending.
  it('ignores logs whose set_number is above the target', () => {
    expect(countCompletedSlots([log(1), log(3), log(4)], 3)).toBe(2)
  })

  it('counts a duplicated set_number once', () => {
    expect(countCompletedSlots([log(1), log(1), log(2)], 3)).toBe(2)
  })
})

describe('isExerciseComplete', () => {
  it('is complete when every slot is filled', () => {
    expect(isExerciseComplete(detail(3, [1, 2, 3]))).toBe(true)
  })

  it('is incomplete when a slot is empty', () => {
    expect(isExerciseComplete(detail(3, [1, 2]))).toBe(false)
  })

  // Same divergence, at the level the FINISH WORKOUT footer used to get wrong.
  it('is incomplete when a log sits above the target and a slot below is empty', () => {
    expect(isExerciseComplete(detail(3, [1, 3, 4]))).toBe(false)
  })

  it('is incomplete when the target is zero', () => {
    expect(isExerciseComplete(detail(0, [1, 2]))).toBe(false)
  })

  it('is incomplete when the target is null', () => {
    expect(isExerciseComplete(detail(null, [1, 2]))).toBe(false)
  })
})
