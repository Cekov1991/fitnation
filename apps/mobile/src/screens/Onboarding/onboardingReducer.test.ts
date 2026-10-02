import { describe, expect, it } from 'vitest'
import { FIRST_STEP, TOTAL_STEPS, onboardingReducer, type OnboardingState } from './onboardingReducer'

const metric: OnboardingState = { currentStep: 2, unit_system: 'metric', age: 30, height: 175, weight: 88 }

describe('onboardingReducer', () => {
  // The client converts nothing (spec 0001): numbers typed as cm/kg cannot be
  // kept under an in/lbs label. Seen on a phone: 175 cm → "175 in" → the server
  // converts to 445 cm and rejects the whole onboarding at Build My Plan.
  it('a unit switch clears the height and weight typed in the old unit', () => {
    const next = onboardingReducer(metric, { type: 'SET', payload: { unit_system: 'imperial' } })
    expect(next.unit_system).toBe('imperial')
    expect(next.height).toBeUndefined()
    expect(next.weight).toBeUndefined()
    expect(next.age).toBe(30)
  })

  it('re-selecting the current unit keeps the numbers', () => {
    const next = onboardingReducer(metric, { type: 'SET', payload: { unit_system: 'metric' } })
    expect(next).toEqual(metric)
  })

  it('a missing unit_system counts as metric', () => {
    const noUnit: OnboardingState = { currentStep: 2, height: 175, weight: 88 }
    expect(onboardingReducer(noUnit, { type: 'SET', payload: { unit_system: 'metric' } }).height).toBe(175)
    expect(onboardingReducer(noUnit, { type: 'SET', payload: { unit_system: 'imperial' } }).height).toBeUndefined()
  })

  it('numbers sent along with the switch win over the clearing', () => {
    const next = onboardingReducer(metric, { type: 'SET', payload: { unit_system: 'imperial', height: 69 } })
    expect(next.height).toBe(69)
    expect(next.weight).toBeUndefined()
  })

  it('other fields never touch height or weight', () => {
    const next = onboardingReducer(metric, { type: 'SET', payload: { age: 31, gender: 'other' } })
    expect(next).toEqual({ ...metric, age: 31, gender: 'other' })
  })

  it('NEXT and BACK clamp to the step range', () => {
    expect(onboardingReducer({ currentStep: TOTAL_STEPS }, { type: 'NEXT' }).currentStep).toBe(TOTAL_STEPS)
    expect(onboardingReducer({ currentStep: FIRST_STEP }, { type: 'BACK' }).currentStep).toBe(FIRST_STEP)
  })
})
