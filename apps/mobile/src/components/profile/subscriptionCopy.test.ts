import { describe, expect, it } from 'vitest'
import type { SubscriptionResource } from '@fit-nation/shared'
import { subscriptionCopy, subscriptionIntro } from './subscriptionCopy'

const sub = (patch: Partial<SubscriptionResource>): SubscriptionResource => ({
  status: null,
  expires_at: null,
  is_trial: false,
  is_sponsored_by_gym: false,
  grace_period_ends_at: null,
  ...patch,
})

describe('subscriptionCopy', () => {
  it('no plan, no access: the subscribe prompt, nothing to manage', () => {
    expect(subscriptionCopy(null, false)).toEqual({
      title: 'No active plan',
      summary: 'Subscribe to unlock workouts, plans and progress tracking.',
      isSponsored: false,
      manageable: false,
    })
  })

  it('no plan but access (grace, flag off): included for now', () => {
    expect(subscriptionCopy(sub({}), true).summary).toBe('Included for now.')
  })

  it('a paid plan reads its status and renewal, and is manageable in the store', () => {
    const copy = subscriptionCopy(sub({ status: 'active', expires_at: '2026-11-02T10:00:00Z' }), true)
    expect(copy.title).toBe('Premium subscription')
    expect(copy.summary).toMatch(/^Active · Renews /)
    expect(copy.manageable).toBe(true)
  })

  it('a trial is named as one', () => {
    expect(subscriptionCopy(sub({ status: 'active', is_trial: true }), true).title).toBe('Free trial')
  })

  it('cancelled and expired plans say until when access lasts, and stay manageable', () => {
    const cancelled = subscriptionCopy(sub({ status: 'cancelled', expires_at: '2026-11-02T10:00:00Z' }), true)
    expect(cancelled.summary).toMatch(/^Cancelled · Access until /)
    expect(cancelled.manageable).toBe(true)
    const expired = subscriptionCopy(sub({ status: 'expired', expires_at: '2026-10-01T23:17:26Z' }), false)
    expect(expired.summary).toMatch(/^Expired · Access until /)
    expect(expired.manageable).toBe(true)
  })

  it('the page intro follows the state', () => {
    expect(subscriptionIntro(subscriptionCopy(sub({ is_sponsored_by_gym: true }), true), 'Google Play'))
      .toBe('Your access is provided through your gym, so there is no plan to manage here.')
    expect(subscriptionIntro(subscriptionCopy(sub({ status: 'active' }), true), 'Google Play'))
      .toMatch(/^Plans are billed through Google Play\. Changing or cancelling happens there/)
    expect(subscriptionIntro(subscriptionCopy(null, false), 'the App Store'))
      .toBe('Plans are billed through the App Store and can be changed or cancelled there at any time.')
  })

  it('a gym sponsorship is never manageable in a store', () => {
    expect(subscriptionCopy(sub({ is_sponsored_by_gym: true }), true)).toEqual({
      title: 'Gym-sponsored access',
      summary: 'Provided through your gym.',
      isSponsored: true,
      manageable: false,
    })
  })
})
