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
  access_source: 'none',
  free_access_kind: null,
  enforced: true,
  signup_trial_days: 7,
  ...patch,
})

describe('subscriptionCopy', () => {
  it('no plan, no access: the subscribe prompt, nothing to manage', () => {
    expect(subscriptionCopy(null, false)).toEqual({
      title: 'No active plan',
      summary: 'Subscribe to unlock workouts, plans and progress tracking.',
      line: 'No active plan',
      isSponsored: false,
      freeAccessKind: null,
      manageable: false,
      shown: true,
    })
  })

  it('no plan but access (grace, flag off): included for now', () => {
    expect(subscriptionCopy(sub({}), true).summary).toBe('Included for now.')
    expect(subscriptionCopy(sub({ enforced: false }), true).line).toBe('Included for now')
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
      line: 'Gym-sponsored access',
      isSponsored: true,
      freeAccessKind: null,
      manageable: false,
      shown: true,
    })
  })
})

// --- Free Access: the Signup Trial and Complimentary Access (026) ----------

// Onboarding finished 2026-10-05 at noon local time: the trial ends on the 12th.
const NOW = new Date(2026, 9, 5, 12, 0, 0)
const ENDS = new Date(2026, 9, 12, 12, 0, 0).toISOString()
const trial = (patch: Partial<SubscriptionResource> = {}) =>
  sub({ grace_period_ends_at: ENDS, free_access_kind: 'signup_trial', access_source: 'signup_trial', ...patch })
const comp = (patch: Partial<SubscriptionResource> = {}) =>
  sub({ grace_period_ends_at: ENDS, free_access_kind: 'complimentary', access_source: 'complimentary', ...patch })

describe('trialDaysLeft', () => {
  it('counts calendar days, not 24-hour blocks', () => {
    expect(trialDaysLeft(ENDS, NOW)).toBe(7)
    expect(trialDaysLeft(ENDS, new Date(2026, 9, 11, 23, 0, 0))).toBe(1)
    expect(trialDaysLeft(ENDS, new Date(2026, 9, 12, 0, 30, 0))).toBe(0)
    expect(trialDaysLeft(ENDS, new Date(2026, 9, 13, 8, 0, 0))).toBe(-1)
  })
})

describe('the Signup Trial state', () => {
  it('is active while the date is ahead and no store plan exists', () => {
    expect(isSignupTrialActive(trial(), NOW)).toBe(true)
    expect(hasSignupTrialEnded(trial(), NOW)).toBe(false)
  })

  it('has ended once the date has passed with nothing taking over', () => {
    const later = new Date(2026, 9, 12, 12, 0, 1)
    expect(isSignupTrialActive(trial(), later)).toBe(false)
    expect(hasSignupTrialEnded(trial(), later)).toBe(true)
  })

  it('Complimentary Access is never a Signup Trial, running or ended', () => {
    expect(isSignupTrialActive(comp(), NOW)).toBe(false)
    expect(hasSignupTrialEnded(comp(), new Date(2026, 9, 13))).toBe(false)
  })

  it('is neither when a current store plan or the gym is behind the access', () => {
    expect(isSignupTrialActive(trial({ status: 'active' }), NOW)).toBe(false)
    expect(hasSignupTrialEnded(trial({ status: 'active', expires_at: '2026-12-01T00:00:00Z' }), new Date(2026, 10, 1))).toBe(false)
    expect(isSignupTrialActive(trial({ is_sponsored_by_gym: true }), NOW)).toBe(false)
    expect(isSignupTrialActive(sub({}), NOW)).toBe(false)
    expect(hasSignupTrialEnded(null, NOW)).toBe(false)
  })

  it('once over, the trial is named only if it outlived any lapsed plan', () => {
    const over = new Date(2026, 9, 13)
    // plan expired on the 3rd, trial ran to the 12th: the trial is the recent lapse
    expect(hasSignupTrialEnded(trial({ status: 'expired', expires_at: '2026-10-03T20:57:30Z' }), over)).toBe(true)
    // plan outlived the trial: a former subscriber, not a trial user
    expect(hasSignupTrialEnded(trial({ status: 'expired', expires_at: '2026-10-12T20:00:00Z' }), over)).toBe(false)
  })
})

describe('subscriptionCopy for Free Access', () => {
  it('a running Signup Trial: "Free trial · N days left"; nothing to manage', () => {
    const copy = subscriptionCopy(trial(), true, NOW)
    expect(copy.title).toBe('Free trial')
    expect(copy.summary).toBe('7 days left')
    expect(copy.line).toBe('Free trial · 7 days left')
    expect(copy.freeAccessKind).toBe('signup_trial')
    expect(copy.manageable).toBe(false)
    expect(copy.shown).toBe(true)
  })

  it('the last two days read as one day left and ends today', () => {
    expect(subscriptionCopy(trial(), true, new Date(2026, 9, 11, 9)).line).toBe('Free trial · 1 day left')
    expect(subscriptionCopy(trial(), true, new Date(2026, 9, 12, 9)).line).toBe('Free trial · Ends today')
  })

  it('running Complimentary Access: "Free access until {date}", never a trial', () => {
    const copy = subscriptionCopy(comp(), true, NOW)
    expect(copy.title).toBe('Free access')
    expect(copy.summary).toBe('Until Oct 12, 2026')
    expect(copy.line).toBe('Free access until Oct 12, 2026')
    expect(copy.freeAccessKind).toBe('complimentary')
    expect(copy.manageable).toBe(false)
  })

  it('ended Free Access with no plan is the plain no-plan prompt', () => {
    for (const s of [trial(), comp()]) {
      const copy = subscriptionCopy(s, false, new Date(2026, 9, 13))
      expect(copy.title).toBe('No active plan')
      expect(copy.summary).toBe('Subscribe to unlock workouts, plans and progress tracking.')
      expect(copy.freeAccessKind).toBe(null)
    }
  })

  it('a lapsed store plan never hides running Free Access (dev user 5 after the Play tests)', () => {
    const copy = subscriptionCopy(trial({ status: 'expired', expires_at: '2026-10-03T20:57:30Z' }), true, NOW)
    expect(copy.line).toBe('Free trial · 7 days left')
    expect(copy.manageable).toBe(false)
    expect(isSignupTrialActive(trial({ status: 'cancelled', expires_at: '2026-10-03T20:57:30Z' }), NOW)).toBe(true)
    expect(subscriptionCopy(comp({ status: 'expired', expires_at: '2026-10-03T20:57:30Z' }), true, NOW).line)
      .toBe('Free access until Oct 12, 2026')
  })

  it('a cancelled plan that still runs outranks Free Access, and is manageable', () => {
    const copy = subscriptionCopy(trial({ status: 'cancelled', expires_at: '2026-10-20T12:00:00Z' }), true, NOW)
    expect(copy.title).toBe('Premium subscription')
    expect(copy.summary).toBe('Cancelled · Access until Oct 20, 2026')
    expect(copy.line).toBe('Cancelled · Access until Oct 20, 2026')
    expect(copy.manageable).toBe(true)
  })

  it('a store plan outranks the Free Access date', () => {
    const copy = subscriptionCopy(comp({ status: 'active', expires_at: '2026-11-05T12:00:00Z' }), true, NOW)
    expect(copy.title).toBe('Premium subscription')
    expect(copy.summary).toBe('Active · Renews Nov 5, 2026')
    expect(copy.freeAccessKind).toBe(null)
    expect(copy.manageable).toBe(true)
  })

  it('the gym outranks everything', () => {
    const copy = subscriptionCopy(trial({ is_sponsored_by_gym: true }), true, NOW)
    expect(copy.title).toBe('Gym-sponsored access')
    expect(copy.freeAccessKind).toBe(null)
  })

  it('the Subscription page intro names the kind of Free Access and where billing happens after it', () => {
    expect(subscriptionIntro(subscriptionCopy(trial(), true, NOW), 'the App Store')).toBe(
      'Your free trial is on. When it ends, plans are billed through the App Store and can be changed or cancelled there.'
    )
    expect(subscriptionIntro(subscriptionCopy(comp(), true, NOW), 'Google Play')).toBe(
      'You have free access for now. When it ends, plans are billed through Google Play and can be changed or cancelled there.'
    )
  })
})

describe('subscriptionCopy while subscriptions are not enforced', () => {
  it('shows no card and no countdown', () => {
    const copy = subscriptionCopy(trial({ enforced: false }), true, NOW)
    expect(copy.shown).toBe(false)
    expect(copy.freeAccessKind).toBe(null)
    expect(copy.line).toBe('Included for now')
    expect(subscriptionCopy(comp({ enforced: false }), true, NOW).line).not.toMatch(/free access|until/i)
  })

  it('still describes a paid plan where it is listed', () => {
    const copy = subscriptionCopy(sub({ enforced: false, status: 'active', expires_at: '2026-11-05T12:00:00Z' }), true, NOW)
    expect(copy.shown).toBe(false)
    expect(copy.line).toBe('Active · Renews Nov 5, 2026')
  })
})
