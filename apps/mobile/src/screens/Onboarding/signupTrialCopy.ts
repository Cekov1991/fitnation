import type { UserResource } from '@fit-nation/shared'

/**
 * What the end of onboarding promises about the Signup Trial: "7 days free",
 * with the length the backend reports (`signup_trial_days`), or null when
 * there is nothing to promise — subscriptions not enforced, no trial
 * configured, or a user who will not get one (it is once per account:
 * already onboarded, or already had Free Access of either kind).
 */
export function signupTrialOffer(
  user: Pick<UserResource, 'onboarding_completed_at' | 'subscription'> | null | undefined,
): string | null {
  const subscription = user?.subscription
  if (!subscription || !subscription.enforced || user.onboarding_completed_at || subscription.free_access_kind) return null
  const days = subscription.signup_trial_days
  if (!(days > 0)) return null
  return `${days} ${days === 1 ? 'day' : 'days'} free`
}
