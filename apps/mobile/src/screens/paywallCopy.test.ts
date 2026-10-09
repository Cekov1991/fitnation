import { describe, expect, it } from 'vitest'
import { paywallHero, purchaseOutcomeMessage } from './paywallCopy'
import { sub } from '../test/fixtures'

const NOW = new Date(2026, 9, 13, 12)
const ENDED = new Date(2026, 9, 12, 12).toISOString()
const SELL = {
  headline: 'Unlock Your Full Potential',
  subheadline: 'Full access to personalized training, the exercise library and progress tracking.',
  ctaLabel: 'Subscribe Now',
}

describe('paywallHero', () => {
  it('names the ended Signup Trial', () => {
    expect(paywallHero(sub({ grace_period_ends_at: ENDED, free_access_kind: 'signup_trial' }), NOW)).toEqual({
      headline: 'Your free trial has ended',
      subheadline: 'Subscribe to keep your plans, workouts and progress.',
      ctaLabel: 'Subscribe Now',
    })
  })

  it('ended Complimentary Access is not called a trial', () => {
    expect(paywallHero(sub({ grace_period_ends_at: ENDED, free_access_kind: 'complimentary' }), NOW)).toEqual(SELL)
  })

  it('never promises a store trial: the CTA is always Subscribe Now', () => {
    expect(paywallHero(null, NOW)).toEqual(SELL)
    expect(JSON.stringify(paywallHero(null, NOW))).not.toMatch(/7-Day|free for/i)
  })

  it('sells the subscription to a plan that outlived the trial', () => {
    expect(
      paywallHero(sub({ status: 'expired', expires_at: '2026-10-12T20:00:00Z', grace_period_ends_at: ENDED, free_access_kind: 'signup_trial' }), NOW),
    ).toEqual(SELL)
  })

  it('a plan that expired before the trial does not take the trial\'s place', () => {
    expect(
      paywallHero(sub({ status: 'expired', expires_at: '2026-10-03T20:57:30Z', grace_period_ends_at: ENDED, free_access_kind: 'signup_trial' }), NOW).headline,
    ).toBe('Your free trial has ended')
  })
})

describe('purchaseOutcomeMessage', () => {
  it('a purchase the store did not grant points to Restore', () => {
    expect(purchaseOutcomeMessage('purchase', 'not-granted')).toBe("Purchase didn't go through — try Restore.")
  })

  it('a restore that found nothing says so', () => {
    expect(purchaseOutcomeMessage('restore', 'not-granted')).toBe('No active subscription was found for this account.')
  })

  it('an unconfirmed account asks to try again, whichever the action', () => {
    expect(purchaseOutcomeMessage('purchase', 'identity-mismatch')).toBe("We couldn't confirm your account. Please try again.")
    expect(purchaseOutcomeMessage('restore', 'identity-mismatch')).toBe("We couldn't confirm your account. Please try again.")
  })

  it('entering needs no message', () => {
    expect(purchaseOutcomeMessage('purchase', 'entered')).toBeNull()
    expect(purchaseOutcomeMessage('restore', 'entered')).toBeNull()
  })
})
