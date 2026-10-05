import type { SubscriptionResource } from '@fit-nation/shared'
import { hasSignupTrialEnded } from '../components/profile/subscriptionCopy'

export interface PaywallHero {
  headline: string
  subheadline: string
  ctaLabel: string
}

/**
 * The paywall's hero, by what brought the user here. A sign-up trial that has
 * run out (spec 0038) is named as such; a store trial on the selected plan
 * sells the trial; anything else sells the subscription. The CTA follows the
 * store offer only — it must never promise a trial the store will not give.
 */
export function paywallHero(
  storeTrialOnSelectedPlan: boolean,
  subscription: SubscriptionResource | null | undefined,
  now: Date = new Date(),
): PaywallHero {
  const ctaLabel = storeTrialOnSelectedPlan ? 'Start 7-Day Free Trial' : 'Subscribe Now'

  if (hasSignupTrialEnded(subscription, now)) {
    return {
      headline: 'Your free trial has ended',
      subheadline: 'Subscribe to keep your plans, workouts and progress.',
      ctaLabel,
    }
  }
  if (storeTrialOnSelectedPlan) {
    return {
      headline: 'Start Your 7-Day Free Trial',
      subheadline: 'Full access to everything, free for 7 days. Cancel anytime before it ends.',
      ctaLabel,
    }
  }
  return {
    headline: 'Unlock Your Full Potential',
    subheadline: 'Full access to personalized training, the exercise library and progress tracking.',
    ctaLabel,
  }
}
