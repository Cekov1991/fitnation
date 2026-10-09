import type { SubscriptionResource } from '@fit-nation/shared'
import { hasSignupTrialEnded } from '../components/profile/subscriptionCopy'
import type { PurchaseFlowResult } from '../lib/purchaseFlow'

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
/** No store trial is offered, so the CTA only ever subscribes. */
const CTA_LABEL = 'Subscribe Now'

export function paywallHero(
  subscription: SubscriptionResource | null | undefined,
  now: Date = new Date(),
): PaywallHero {
  if (hasSignupTrialEnded(subscription, now)) {
    return {
      headline: 'Your free trial has ended',
      subheadline: 'Subscribe to keep your plans, workouts and progress.',
      ctaLabel: CTA_LABEL,
    }
  }
  return {
    headline: 'Unlock Your Full Potential',
    subheadline: 'Full access to personalized training, the exercise library and progress tracking.',
    ctaLabel: CTA_LABEL,
  }
}

/**
 * The toast after a purchase or restore, by the purchase flow's outcome; null
 * when the user simply goes in. A purchase the store completed without granting
 * `app_access` (026/12) is pointed at Restore rather than left silent.
 */
export function purchaseOutcomeMessage(
  action: 'purchase' | 'restore',
  outcome: PurchaseFlowResult['kind'],
): string | null {
  switch (outcome) {
    case 'entered':
      return null
    case 'identity-mismatch':
      return "We couldn't confirm your account. Please try again."
    case 'not-granted':
      return action === 'purchase'
        ? "Purchase didn't go through — try Restore."
        : 'No active subscription was found for this account.'
  }
}
