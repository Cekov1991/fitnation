import { describe, expect, it } from 'vitest'
import { HOUSE_PARTNER_ID, offersJoinPromptStep, pickNearestPartner, shouldRunJoinPrompt } from './joinPrompt'

/**
 * The Join Prompt decision (ticket #94): a House Partner customer standing in
 * a Join-Prompt-enabled gym is offered that Partner between registration and
 * Onboarding. This module owns the two choices with no React and no IO:
 * whether the step runs at all, and which nearby Partner to offer. The server
 * is the real eligibility gate (`/partners/nearby` answers `[]` for anyone
 * ineligible); these rules only keep the step invisible when asking would be
 * pointless or rude.
 */
describe('shouldRunJoinPrompt', () => {
  it('runs for a House Partner customer who has not been asked and can still be asked', () => {
    expect(
      shouldRunJoinPrompt({
        userPartnerId: HOUSE_PARTNER_ID,
        alreadyAsked: false,
        permissionStatus: 'undetermined',
      })
    ).toBe(true)
  })

  it('skips a customer already on a Partner — a Gym Join is one-way and only starts from the House Partner', () => {
    expect(
      shouldRunJoinPrompt({ userPartnerId: 42, alreadyAsked: false, permissionStatus: 'undetermined' })
    ).toBe(false)
  })

  it('skips a user without a partner — nothing to move from, and the shape is unexpected', () => {
    expect(
      shouldRunJoinPrompt({ userPartnerId: null, alreadyAsked: false, permissionStatus: 'undetermined' })
    ).toBe(false)
  })

  it('asks once per session: already asked means skip', () => {
    expect(
      shouldRunJoinPrompt({ userPartnerId: HOUSE_PARTNER_ID, alreadyAsked: true, permissionStatus: 'granted' })
    ).toBe(false)
  })

  it('skips when location permission is denied — the person already said no, and the step stays invisible', () => {
    expect(
      shouldRunJoinPrompt({ userPartnerId: HOUSE_PARTNER_ID, alreadyAsked: false, permissionStatus: 'denied' })
    ).toBe(false)
  })

  it('runs when permission is already granted — no OS prompt needed, straight to the location fix', () => {
    expect(
      shouldRunJoinPrompt({ userPartnerId: HOUSE_PARTNER_ID, alreadyAsked: false, permissionStatus: 'granted' })
    ).toBe(true)
  })
})

/**
 * The navigator decides the launch route synchronously, before the (async)
 * permission state can be read, so routing uses the permission-free subset:
 * offer the step to an unasked House customer and let the screen itself skip
 * on a denied permission.
 */
describe('offersJoinPromptStep', () => {
  it('offers the step to an unasked House Partner customer', () => {
    expect(offersJoinPromptStep({ userPartnerId: HOUSE_PARTNER_ID, alreadyAsked: false })).toBe(true)
  })

  it('does not offer it to a Gym Signup, or twice in a session', () => {
    expect(offersJoinPromptStep({ userPartnerId: 42, alreadyAsked: false })).toBe(false)
    expect(offersJoinPromptStep({ userPartnerId: HOUSE_PARTNER_ID, alreadyAsked: true })).toBe(false)
  })
})

describe('pickNearestPartner', () => {
  it('picks the first Partner — `/partners/nearby` answers nearest first, and only [0] is offered', () => {
    const nearest = { id: 7, name: 'Iron Temple' }
    expect(pickNearestPartner([nearest, { id: 8, name: 'Further Gym' }])).toBe(nearest)
  })

  it('answers null for an empty list — ineligible users get [] from the server, and that is "no prompt", not an error', () => {
    expect(pickNearestPartner([])).toBeNull()
  })
})
