import { describe, it, expect } from 'vitest'
import {
  PROFILE_SECTIONS,
  ONBOARDING_SECTIONS,
  isSectionComplete,
  isSectionDirty,
  pickSection,
  validateSection,
} from './profileSections'

/**
 * The section registry is what lets onboarding and the profile pages share
 * one body. These pin the contract the shells rely on.
 */
describe('profile sections', () => {
  it('partitions the onboarding fields without overlap', () => {
    const seen = new Set<string>()
    for (const key of ONBOARDING_SECTIONS) {
      for (const f of PROFILE_SECTIONS[key].fields) {
        expect(seen.has(f), `${f} appears in two sections`).toBe(false)
        seen.add(f)
      }
    }
    expect([...seen].sort()).toEqual(
      ['age', 'fitness_goal', 'gender', 'height', 'training_days_per_week', 'training_experience', 'unit_system', 'weight', 'workout_duration_minutes'].sort()
    )
  })

  it('isSectionComplete gates on every required field', () => {
    expect(isSectionComplete('goal', {})).toBe(false)
    expect(isSectionComplete('goal', { fitness_goal: 'strength' })).toBe(true)
    expect(isSectionComplete('about', { unit_system: 'metric', age: 30, height: 180, weight: 80 })).toBe(false)
    expect(isSectionComplete('about', { unit_system: 'metric', age: 30, height: 180, weight: 80, gender: 'other' })).toBe(true)
  })

  it('pickSection sends only the section, and drops unset fields', () => {
    const draft = { name: 'A', fitness_goal: 'fat_loss' as const, age: 30, weight: undefined }
    expect(pickSection('goal', draft)).toEqual({ fitness_goal: 'fat_loss' })
    expect(pickSection('about', draft)).toEqual({ age: 30 })
  })

  it('isSectionDirty compares only the section', () => {
    const saved = { name: 'A', age: 30 }
    expect(isSectionDirty('about', saved, { ...saved, age: 31 })).toBe(true)
    expect(isSectionDirty('about', saved, { ...saved, name: 'B' })).toBe(false)
    expect(isSectionDirty('account', saved, { ...saved, name: 'B' })).toBe(true)
  })

  it('validateSection reports bounds in the unit being typed, and ignores blanks', () => {
    expect(validateSection('about', { height: 300 }, 'metric').height).toMatch(/Height must be between/)
    expect(validateSection('about', { height: 70 }, 'imperial')).toEqual({})
    expect(validateSection('about', {}, 'metric')).toEqual({})
    expect(validateSection('account', { email: 'nope' }, 'metric').email).toMatch(/email/i)
  })
})
