import type { SubscriptionResource } from '@fit-nation/shared'

/**
 * A `/user` subscription block for tests: no plan, no free access, enforced,
 * a 7-day Signup Trial configured. Patch what the case is about.
 */
export const sub = (patch: Partial<SubscriptionResource> = {}): SubscriptionResource => ({
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
