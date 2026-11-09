import { beforeEach, describe, expect, it } from 'vitest'
import {
  markJoinPromptAsked,
  offersJoinPromptStepFor,
  resetJoinPromptSession,
  wasJoinPromptAsked,
} from './joinPromptSession'

/**
 * The "already asked" half of the Join Prompt decision's input: in-memory and
 * per user, so one app session asks once, a different account on the same
 * phone still gets its own ask, and a relaunch starts clean. Persistent
 * dismissals are ticket #95's `/join-prompt/dismissals` — not this.
 */
describe('join prompt session flag', () => {
  beforeEach(() => resetJoinPromptSession())

  it('starts unasked, and marking is per user', () => {
    expect(wasJoinPromptAsked(1)).toBe(false)
    markJoinPromptAsked(1)
    expect(wasJoinPromptAsked(1)).toBe(true)
    expect(wasJoinPromptAsked(2)).toBe(false)
  })

  it('an unknown user (not signed in yet) counts as asked — the step never runs without a user', () => {
    expect(wasJoinPromptAsked(null)).toBe(true)
    expect(wasJoinPromptAsked(undefined)).toBe(true)
  })
})

/**
 * The routing question both navigation callers ask, keyed on the API's
 * `is_house` flag (ticket #98), never a hardcoded partner id.
 */
describe('offersJoinPromptStepFor', () => {
  beforeEach(() => resetJoinPromptSession())

  it('offers the step to an unasked customer whose partner the API marks as House', () => {
    expect(offersJoinPromptStepFor({ id: 9, partner: { is_house: true } })).toBe(true)
  })

  it('skips a customer on a real Partner, and a signed-out user', () => {
    expect(offersJoinPromptStepFor({ id: 9, partner: { is_house: false } })).toBe(false)
    expect(offersJoinPromptStepFor(null)).toBe(false)
  })

  it('fails closed on a cached pre-flag payload — a partner without is_house is not offered the prompt', () => {
    expect(offersJoinPromptStepFor({ id: 9, partner: {} })).toBe(false)
  })

  it('offers at most once per session', () => {
    markJoinPromptAsked(9)
    expect(offersJoinPromptStepFor({ id: 9, partner: { is_house: true } })).toBe(false)
  })
})
