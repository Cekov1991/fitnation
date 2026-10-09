import type { SubscriptionResource } from '@fit-nation/shared'
import { hasSignupTrialEnded } from '../components/profile/subscriptionCopy'

export interface PaywallHero {
  headline: string
  subheadline: string
  ctaLabel: string
}

/**
 * The paywall's hero, by what brought the user here. A Signup Trial that has
 * run out is named as such; anything else — including ended Complimentary
 * Access — sells the subscription. The stores offer no free trial (026), so
 * the paywall never promises one.
 */
export function paywallHero(
  subscription: SubscriptionResource | null | undefined,
  now: Date = new Date(),
): PaywallHero {
  if (hasSignupTrialEnded(subscription, now)) {
    return {
      headline: 'Your free trial has ended',
      subheadline: 'Subscribe to keep your plans, workouts and progress.',
      ctaLabel: 'Subscribe Now',
    }
  }
  return {
    headline: 'Unlock Your Full Potential',
    subheadline: 'Full access to personalized training, the exercise library and progress tracking.',
    ctaLabel: 'Subscribe Now',
  }
}
