import { describe, expect, it } from 'vitest'
import type { SubscriptionResource, UserResource } from '@fit-nation/shared'
import { signupTrialOffer } from './signupTrialCopy'

const sub = (patch: Partial<SubscriptionResource> = {}): SubscriptionResource => ({
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

const user = (subscription: SubscriptionResource | null, onboarding_completed_at: string | null = null) =>
  ({ onboarding_completed_at, subscription }) as Pick<UserResource, 'onboarding_completed_at' | 'subscription'>

describe('signupTrialOffer (end of onboarding)', () => {
  it('names the Signup Trial length the backend reports', () => {
    expect(signupTrialOffer(user(sub()))).toBe('7 days free')
    expect(signupTrialOffer(user(sub({ signup_trial_days: 14 })))).toBe('14 days free')
    expect(signupTrialOffer(user(sub({ signup_trial_days: 1 })))).toBe('1 day free')
  })

  it('says nothing when there is no Signup Trial', () => {
    expect(signupTrialOffer(user(sub({ signup_trial_days: 0 })))).toBeNull()
    expect(signupTrialOffer(user(null))).toBeNull()
    expect(signupTrialOffer(null)).toBeNull()
  })

  it('says nothing while subscriptions are not enforced: there is no paywall to escape yet', () => {
    expect(signupTrialOffer(user(sub({ enforced: false })))).toBeNull()
  })

  it('says nothing to a user who will not get one: once per account', () => {
    // regenerating a plan after onboarding
    expect(signupTrialOffer(user(sub(), '2026-10-01T10:00:00Z'))).toBeNull()
    // already had Free Access of either kind
    expect(signupTrialOffer(user(sub({ free_access_kind: 'complimentary', grace_period_ends_at: '2026-12-01T00:00:00Z' })))).toBeNull()
    expect(signupTrialOffer(user(sub({ free_access_kind: 'signup_trial' })))).toBeNull()
  })
})
