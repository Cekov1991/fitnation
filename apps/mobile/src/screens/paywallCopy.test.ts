import { describe, expect, it } from 'vitest'
import type { SubscriptionResource } from '@fit-nation/shared'
import { paywallHero } from './paywallCopy'

const sub = (patch: Partial<SubscriptionResource>): SubscriptionResource => ({
  status: null,
  expires_at: null,
  is_trial: false,
  is_sponsored_by_gym: false,
  grace_period_ends_at: null,
  ...patch,
})

const NOW = new Date(2026, 9, 13, 12)
const ENDED = new Date(2026, 9, 12, 12).toISOString()

describe('paywallHero', () => {
  it('names the ended sign-up trial, and still sells only what the store offers', () => {
    expect(paywallHero(false, sub({ grace_period_ends_at: ENDED }), NOW)).toEqual({
      headline: 'Your free trial has ended',
      subheadline: 'Subscribe to keep your plans, workouts and progress.',
      ctaLabel: 'Subscribe Now',
    })
    expect(paywallHero(true, sub({ grace_period_ends_at: ENDED }), NOW).ctaLabel).toBe('Start 7-Day Free Trial')
  })

  it('sells the store trial when the selected plan carries one', () => {
    expect(paywallHero(true, null, NOW)).toEqual({
      headline: 'Start Your 7-Day Free Trial',
      subheadline: 'Full access to everything, free for 7 days. Cancel anytime before it ends.',
      ctaLabel: 'Start 7-Day Free Trial',
    })
  })

  it('sells the subscription otherwise: no trial, or a plan that outlived the trial', () => {
    expect(paywallHero(false, null, NOW).headline).toBe('Unlock Your Full Potential')
    expect(paywallHero(false, sub({ status: 'expired', expires_at: '2026-10-12T20:00:00Z', grace_period_ends_at: ENDED }), NOW).headline).toBe('Unlock Your Full Potential')
  })

  it('a plan that expired before the trial does not take the trial\'s place', () => {
    expect(paywallHero(false, sub({ status: 'expired', expires_at: '2026-10-03T20:57:30Z', grace_period_ends_at: ENDED }), NOW).headline).toBe('Your free trial has ended')
  })
})
