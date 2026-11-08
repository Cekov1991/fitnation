import { beforeEach, describe, expect, it } from 'vitest'
import { markJoinPromptAsked, resetJoinPromptSession, wasJoinPromptAsked } from './joinPromptSession'

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
