import type { SubscriptionResource } from '@fit-nation/shared'
import { hasSignupTrialEnded, isSignupTrialActive, trialDaysLeft } from '../components/profile/subscriptionCopy'
import type { PurchaseFlowResult } from '../lib/purchaseFlow'

export interface PaywallHero {
  headline: string
  subheadline: string
  ctaLabel: string
}

/**
 * The paywall's hero, by what brought the user here. A Signup Trial that has
 * run out is named as such; one still running (the plans opened from the
 * Profile tab) says what is left of it and that subscribing starts the paid
 * plan today; anything else — including ended Complimentary Access — sells
 * the subscription. The stores offer no free trial (026), so the paywall
 * never promises one.
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
  const trialEndsAt = subscription?.grace_period_ends_at
  if (trialEndsAt && isSignupTrialActive(subscription, now)) {
    return {
      headline: 'Keep going after your trial',
      subheadline: `${trialLeft(trialEndsAt, now)} Subscribing now starts your paid plan today.`,
      ctaLabel: CTA_LABEL,
    }
  }
  return {
    headline: 'Unlock Your Full Potential',
    subheadline: 'Full access to personalized training, the exercise library and progress tracking.',
    ctaLabel: CTA_LABEL,
  }
}

/** `Your free trial has 5 days left.`, then `… 1 day left.`, then `Your free trial ends today.` */
function trialLeft(endsAt: string, now: Date): string {
  const days = trialDaysLeft(endsAt, now)
  if (days <= 0) return 'Your free trial ends today.'
  return `Your free trial has ${days} ${days === 1 ? 'day' : 'days'} left.`
}

/**
 * The toast after buying or restoring from the plans opened during the Signup
 * Trial: the screen goes back to where it was opened, and nothing else there
 * says the plan is on.
 */
export const SUBSCRIBED_MESSAGE = "You're subscribed."

export type PurchaseAction = 'purchase' | 'restore'

/**
 * The toast after a purchase or restore, by the purchase flow's outcome; null
 * when the user simply goes in. A purchase the store completed without granting
 * `app_access` (026/12) is pointed at Restore rather than left silent.
 */
export function purchaseOutcomeMessage(
  action: PurchaseAction,
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
