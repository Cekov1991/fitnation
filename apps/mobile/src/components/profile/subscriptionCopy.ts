import { formatDate } from '@fit-nation/shared'
import type { FreeAccessKind, SubscriptionResource } from '@fit-nation/shared'

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
  /** Title and summary as one line, for a row that has room for one (Account → Subscription). */
  line: string
  isSponsored: boolean
  /** The Free Access granting access today — Signup Trial or Complimentary Access — or null. */
  freeAccessKind: FreeAccessKind | null
  manageable: boolean
  /** False while subscriptions are not enforced: the Profile tab shows no subscription card then (026). */
  shown: boolean
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
 * expiry. A plan that has lapsed is history — it must not hide Free Access
 * that is granting access now, nor claim the paywall from a trial that ended after it.
 */
export function storePlanIsCurrent(subscription: SubscriptionResource | null | undefined, now: Date = new Date()): boolean {
  if (!subscription?.status || subscription.status === 'expired') return false
  return !subscription.expires_at || new Date(subscription.expires_at).getTime() > now.getTime()
}

/**
 * The kind of Free Access granting access now — a future date, no gym and no
 * current store plan — or null. A date without a kind reads as Complimentary
 * Access, as the backend reads it.
 */
function runningFreeAccess(subscription: SubscriptionResource | null | undefined, now: Date): FreeAccessKind | null {
  if (!subscription?.grace_period_ends_at || subscription.is_sponsored_by_gym || storePlanIsCurrent(subscription, now)) return null
  if (new Date(subscription.grace_period_ends_at).getTime() <= now.getTime()) return null
  return subscription.free_access_kind ?? 'complimentary'
}

/** True while the Signup Trial grants access: its date ahead, no gym and no current store plan. */
export function isSignupTrialActive(subscription: SubscriptionResource | null | undefined, now: Date = new Date()): boolean {
  return runningFreeAccess(subscription, now) === 'signup_trial'
}

/**
 * True once the Signup Trial has run out and nothing took over: no current
 * store plan, and no lapsed plan that outlived the trial (a former subscriber
 * whose plan ended after the free days is sold the subscription, not told
 * about a trial). Ended Complimentary Access is never a trial.
 */
export function hasSignupTrialEnded(subscription: SubscriptionResource | null | undefined, now: Date = new Date()): boolean {
  if (subscription?.is_sponsored_by_gym || storePlanIsCurrent(subscription, now)) return false
  if (subscription?.free_access_kind !== 'signup_trial' || !subscription.grace_period_ends_at) return false
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
  // While not enforced, Free Access is not a countdown to anything (026).
  const enforced = subscription?.enforced !== false
  const isSponsored = subscription?.is_sponsored_by_gym ?? false
  const freeAccessKind = enforced ? runningFreeAccess(subscription, now) : null
  const endsAt = subscription?.grace_period_ends_at ?? ''
  // A lapsed plan is still described (status, access until) — unless Free Access is running.
  const status = freeAccessKind ? null : (subscription?.status ?? null)

  const title = isSponsored
    ? 'Gym-sponsored access'
    : freeAccessKind === 'complimentary'
      ? 'Free access'
      : subscription?.is_trial || freeAccessKind === 'signup_trial'
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
      : freeAccessKind === 'signup_trial'
        ? daysLeft(endsAt, now)
        : freeAccessKind === 'complimentary'
          ? `Until ${formatDate(endsAt, 'long')}`
          : hasAccess
            ? 'Included for now.'
            : 'Subscribe to unlock workouts, plans and progress tracking.'

  const manageable = !!status && !isSponsored
  const line = manageable
    ? summary
    : freeAccessKind === 'signup_trial'
      ? `${title} · ${summary}`
      : freeAccessKind === 'complimentary'
        ? `Free access until ${formatDate(endsAt, 'long')}`
        : !isSponsored && !subscription?.is_trial && hasAccess
          ? 'Included for now'
          : title

  return { title, summary, line, isSponsored, freeAccessKind, manageable, shown: enforced }
}

/** `7 days left`, then `1 day left`, then `Ends today`. */
function daysLeft(endsAt: string, now: Date): string {
  const days = trialDaysLeft(endsAt, now)
  if (days <= 0) return 'Ends today'
  return `${days} ${days === 1 ? 'day' : 'days'} left`
}

/**
 * The Subscription page's intro line, by state: a sponsored member has no plan
 * to manage; a paid plan is changed or cancelled in the store; anyone else is
 * told where a plan would be billed, without repeating the card's prompt.
 */
export function subscriptionIntro(copy: SubscriptionCopy, storeName: string): string {
  if (copy.isSponsored) return 'Your access is provided through your gym, so there is no plan to manage here.'
  if (copy.freeAccessKind) {
    const lead = copy.freeAccessKind === 'signup_trial' ? 'Your free trial is on.' : 'You have free access for now.'
    return `${lead} When it ends, plans are billed through ${storeName} and can be changed or cancelled there.`
  }
  if (copy.manageable) {
    return `Plans are billed through ${storeName}. Changing or cancelling happens there, and your access runs to the end of the period you have paid for.`
  }
  return `Plans are billed through ${storeName} and can be changed or cancelled there at any time.`
}
