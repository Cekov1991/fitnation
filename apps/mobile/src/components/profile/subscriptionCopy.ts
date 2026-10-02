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
  manageable: boolean
}

export function subscriptionCopy(subscription: SubscriptionResource | null | undefined, hasAccess: boolean): SubscriptionCopy {
  const isSponsored = subscription?.is_sponsored_by_gym ?? false
  const status = subscription?.status ?? null

  const title = isSponsored
    ? 'Gym-sponsored access'
    : subscription?.is_trial
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
      : hasAccess
        ? 'Included for now.'
        : 'Subscribe to unlock workouts, plans and progress tracking.'

  return { title, summary, isSponsored, manageable: !!status && !isSponsored }
}

/**
 * The Subscription page's intro line, by state: a sponsored member has no plan
 * to manage; a paid plan is changed or cancelled in the store; anyone else is
 * told where a plan would be billed, without repeating the card's prompt.
 */
export function subscriptionIntro(copy: SubscriptionCopy, storeName: string): string {
  if (copy.isSponsored) return 'Your access is provided through your gym, so there is no plan to manage here.'
  if (copy.manageable) {
    return `Plans are billed through ${storeName}. Changing or cancelling happens there, and your access runs to the end of the period you have paid for.`
  }
  return `Plans are billed through ${storeName} and can be changed or cancelled there at any time.`
}
