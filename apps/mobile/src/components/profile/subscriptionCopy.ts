import { formatDate } from '@fit-nation/shared'
import type { SubscriptionResource } from '@fit-nation/shared'

/**
 * The words for a subscription state, shared by the Profile tab's card, the
 * Account page's row and the Subscription page so the three never disagree.
 * `manageable` says whether the store's subscription page applies: a paid
 * plan in any state, never a gym sponsorship or no plan at all.
 */
export const SUBSCRIPTION_STATUS_LABELS: Record<NonNullable<SubscriptionResource['status']>, string> = {
  active: 'Active',
  billing_issue: 'Payment failed',
  cancelled: 'Cancelled',
  expired: 'Expired',
  paused: 'Paused',
}

export interface SubscriptionCopy {
  title: string
  summary: string
  isSponsored: boolean
  /** The sign-up trial (spec 0038): free days with no store plan behind them. */
  isTrial: boolean
  manageable: boolean
}

/**
 * Calendar days from today to the day the trial ends, in local time: 7 right
 * after onboarding, 1 the day before, 0 on the last day, negative once over.
 */
export function trialDaysLeft(endsAt: string, now: Date = new Date()): number {
  const startOfDay = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime()
  return Math.round((startOfDay(new Date(endsAt)) - startOfDay(now)) / 86_400_000)
}

/**
 * A store plan that still counts: any status but expired, and not past its
 * expiry. A plan that has lapsed is history — it must not hide a trial that
 * is granting access now, nor claim the paywall from a trial that ended after it.
 */
export function storePlanIsCurrent(subscription: SubscriptionResource | null | undefined, now: Date = new Date()): boolean {
  if (!subscription?.status || subscription.status === 'expired') return false
  return !subscription.expires_at || new Date(subscription.expires_at).getTime() > now.getTime()
}

/** True while the sign-up trial grants access: a future date and no current store plan. */
export function isSignupTrialActive(subscription: SubscriptionResource | null | undefined, now: Date = new Date()): boolean {
  return (
    !subscription?.is_sponsored_by_gym &&
    !storePlanIsCurrent(subscription, now) &&
    !!subscription?.grace_period_ends_at &&
    new Date(subscription.grace_period_ends_at).getTime() > now.getTime()
  )
}

/**
 * True once the sign-up trial has run out and nothing took over: no current
 * store plan, and no lapsed plan that outlived the trial (a former subscriber
 * whose plan ended after the free days is sold the subscription, not told
 * about a trial).
 */
export function hasSignupTrialEnded(subscription: SubscriptionResource | null | undefined, now: Date = new Date()): boolean {
  if (subscription?.is_sponsored_by_gym || storePlanIsCurrent(subscription, now)) return false
  if (!subscription?.grace_period_ends_at) return false
  const trialEnd = new Date(subscription.grace_period_ends_at).getTime()
  if (trialEnd > now.getTime()) return false
  const planEnd = subscription.expires_at ? new Date(subscription.expires_at).getTime() : 0
  return trialEnd >= planEnd
}

export function subscriptionCopy(
  subscription: SubscriptionResource | null | undefined,
  hasAccess: boolean,
  now: Date = new Date(),
): SubscriptionCopy {
  const isSponsored = subscription?.is_sponsored_by_gym ?? false
  const isTrial = isSignupTrialActive(subscription, now)
  // A lapsed plan is still described (status, access until) — unless a trial is running.
  const status = isTrial ? null : (subscription?.status ?? null)

  const title = isSponsored
    ? 'Gym-sponsored access'
    : subscription?.is_trial || isTrial
      ? 'Free trial'
      : status
        ? 'Premium subscription'
        : 'No active plan'

  const summary = isSponsored
    ? 'Provided through your gym.'
    : status
      ? [
          SUBSCRIPTION_STATUS_LABELS[status],
          subscription?.expires_at
            ? `${status === 'cancelled' || status === 'expired' ? 'Access until' : 'Renews'} ${formatDate(subscription.expires_at, 'long')}`
            : null,
        ]
          .filter(Boolean)
          .join(' · ')
      : isTrial
        ? trialSummary(subscription!.grace_period_ends_at!, now)
        : hasAccess
          ? 'Included for now.'
          : 'Subscribe to unlock workouts, plans and progress tracking.'

  return { title, summary, isSponsored, isTrial, manageable: !!status && !isSponsored }
}

/** `Ends Oct 12, 2026 · 7 days left`, then `Ends tomorrow`, then `Ends today`. */
function trialSummary(endsAt: string, now: Date): string {
  const days = trialDaysLeft(endsAt, now)
  if (days <= 0) return 'Ends today'
  if (days === 1) return 'Ends tomorrow'
  return `Ends ${formatDate(endsAt, 'long')} · ${days} days left`
}

/**
 * The Subscription page's intro line, by state: a sponsored member has no plan
 * to manage; a paid plan is changed or cancelled in the store; anyone else is
 * told where a plan would be billed, without repeating the card's prompt.
 */
export function subscriptionIntro(copy: SubscriptionCopy, storeName: string): string {
  if (copy.isSponsored) return 'Your access is provided through your gym, so there is no plan to manage here.'
  if (copy.isTrial) {
    return `Your free trial is on. When it ends, plans are billed through ${storeName} and can be changed or cancelled there.`
  }
  if (copy.manageable) {
    return `Plans are billed through ${storeName}. Changing or cancelling happens there, and your access runs to the end of the period you have paid for.`
  }
  return `Plans are billed through ${storeName} and can be changed or cancelled there at any time.`
}
