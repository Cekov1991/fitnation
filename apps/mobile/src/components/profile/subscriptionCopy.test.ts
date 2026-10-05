import { describe, expect, it } from 'vitest'
import type { SubscriptionResource } from '@fit-nation/shared'
import {
  hasSignupTrialEnded,
  isSignupTrialActive,
  subscriptionCopy,
  subscriptionIntro,
  trialDaysLeft,
} from './subscriptionCopy'

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
      isTrial: false,
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
      isTrial: false,
      manageable: false,
    })
  })
})

// --- The sign-up trial (spec 0038) ---------------------------------------------

// Onboarding finished 2026-10-05 at noon local time: the trial ends on the 12th.
const NOW = new Date(2026, 9, 5, 12, 0, 0)
const ENDS = new Date(2026, 9, 12, 12, 0, 0).toISOString()

describe('trialDaysLeft', () => {
  it('counts calendar days, not 24-hour blocks', () => {
    expect(trialDaysLeft(ENDS, NOW)).toBe(7)
    expect(trialDaysLeft(ENDS, new Date(2026, 9, 11, 23, 0, 0))).toBe(1)
    expect(trialDaysLeft(ENDS, new Date(2026, 9, 12, 0, 30, 0))).toBe(0)
    expect(trialDaysLeft(ENDS, new Date(2026, 9, 13, 8, 0, 0))).toBe(-1)
  })
})

describe('the sign-up trial state', () => {
  it('is active while the date is ahead and no store plan exists', () => {
    expect(isSignupTrialActive(sub({ grace_period_ends_at: ENDS }), NOW)).toBe(true)
    expect(hasSignupTrialEnded(sub({ grace_period_ends_at: ENDS }), NOW)).toBe(false)
  })

  it('has ended once the date has passed with nothing taking over', () => {
    const later = new Date(2026, 9, 12, 12, 0, 1)
    expect(isSignupTrialActive(sub({ grace_period_ends_at: ENDS }), later)).toBe(false)
    expect(hasSignupTrialEnded(sub({ grace_period_ends_at: ENDS }), later)).toBe(true)
  })

  it('is neither when a current store plan or the gym is behind the access', () => {
    expect(isSignupTrialActive(sub({ grace_period_ends_at: ENDS, status: 'active' }), NOW)).toBe(false)
    expect(hasSignupTrialEnded(sub({ grace_period_ends_at: ENDS, status: 'active', expires_at: '2026-12-01T00:00:00Z' }), new Date(2026, 10, 1))).toBe(false)
    expect(isSignupTrialActive(sub({ grace_period_ends_at: ENDS, is_sponsored_by_gym: true }), NOW)).toBe(false)
    expect(isSignupTrialActive(sub({}), NOW)).toBe(false)
    expect(hasSignupTrialEnded(null, NOW)).toBe(false)
  })

  it('once over, the trial is named only if it outlived any lapsed plan', () => {
    const over = new Date(2026, 9, 13)
    // plan expired on the 3rd, trial ran to the 12th: the trial is the recent lapse
    expect(hasSignupTrialEnded(sub({ grace_period_ends_at: ENDS, status: 'expired', expires_at: '2026-10-03T20:57:30Z' }), over)).toBe(true)
    // plan outlived the trial: a former subscriber, not a trial user
    expect(hasSignupTrialEnded(sub({ grace_period_ends_at: ENDS, status: 'expired', expires_at: '2026-10-12T20:00:00Z' }), over)).toBe(false)
  })
})

describe('subscriptionCopy for the sign-up trial', () => {
  it('a running trial: title, end date and the countdown; nothing to manage', () => {
    const copy = subscriptionCopy(sub({ grace_period_ends_at: ENDS }), true, NOW)
    expect(copy.title).toBe('Free trial')
    expect(copy.summary).toBe('Ends Oct 12, 2026 · 7 days left')
    expect(copy.isTrial).toBe(true)
    expect(copy.manageable).toBe(false)
  })

  it('the last two days read as tomorrow and today', () => {
    expect(subscriptionCopy(sub({ grace_period_ends_at: ENDS }), true, new Date(2026, 9, 11, 9)).summary).toBe('Ends tomorrow')
    expect(subscriptionCopy(sub({ grace_period_ends_at: ENDS }), true, new Date(2026, 9, 12, 9)).summary).toBe('Ends today')
  })

  it('an ended trial with no plan is the plain no-plan prompt', () => {
    const copy = subscriptionCopy(sub({ grace_period_ends_at: ENDS }), false, new Date(2026, 9, 13))
    expect(copy.title).toBe('No active plan')
    expect(copy.summary).toBe('Subscribe to unlock workouts, plans and progress tracking.')
    expect(copy.isTrial).toBe(false)
  })

  it('a lapsed store plan never hides a running trial (dev user 5 after the Play tests)', () => {
    const copy = subscriptionCopy(sub({ grace_period_ends_at: ENDS, status: 'expired', expires_at: '2026-10-03T20:57:30Z' }), true, NOW)
    expect(copy.title).toBe('Free trial')
    expect(copy.summary).toBe('Ends Oct 12, 2026 · 7 days left')
    expect(copy.isTrial).toBe(true)
    expect(copy.manageable).toBe(false)
    expect(isSignupTrialActive(sub({ grace_period_ends_at: ENDS, status: 'cancelled', expires_at: '2026-10-03T20:57:30Z' }), NOW)).toBe(true)
  })

  it('a cancelled plan that still runs outranks the trial, and is manageable', () => {
    const copy = subscriptionCopy(sub({ grace_period_ends_at: ENDS, status: 'cancelled', expires_at: '2026-10-20T12:00:00Z' }), true, NOW)
    expect(copy.title).toBe('Premium subscription')
    expect(copy.summary).toBe('Cancelled · Access until Oct 20, 2026')
    expect(copy.manageable).toBe(true)
  })

  it('a store plan outranks the trial date', () => {
    const copy = subscriptionCopy(sub({ grace_period_ends_at: ENDS, status: 'active', expires_at: '2026-11-05T12:00:00Z' }), true, NOW)
    expect(copy.title).toBe('Premium subscription')
    expect(copy.summary).toBe('Active · Renews Nov 5, 2026')
    expect(copy.isTrial).toBe(false)
    expect(copy.manageable).toBe(true)
  })

  it('the gym outranks everything', () => {
    const copy = subscriptionCopy(sub({ grace_period_ends_at: ENDS, is_sponsored_by_gym: true }), true, NOW)
    expect(copy.title).toBe('Gym-sponsored access')
    expect(copy.isTrial).toBe(false)
  })

  it('the Subscription page intro names the trial and where billing happens after it', () => {
    const copy = subscriptionCopy(sub({ grace_period_ends_at: ENDS }), true, NOW)
    expect(subscriptionIntro(copy, 'the App Store')).toBe(
      'Your free trial is on. When it ends, plans are billed through the App Store and can be changed or cancelled there.'
    )
  })
})
