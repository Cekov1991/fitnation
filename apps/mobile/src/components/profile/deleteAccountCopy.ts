import type { SubscriptionResource } from '@fit-nation/shared'

/**
 * The words of the delete-account sheet, shared with its test. The body names
 * what goes — profile, plans, history — and what the deletion does to the
 * plan that grants access today: a gym sponsorship ends with the account; a
 * store subscription does not, it keeps billing until it is cancelled in the
 * store, so the sheet says so. The typed word is the friction before an
 * irreversible action; no password is asked for (decided 2026-10-02 — the
 * signed-in session already proves who is asking, and a social account has
 * no password to type).
 */
export const DELETE_CONFIRMATION_WORD = 'DELETE'

/** Case and surrounding spaces do not matter: " delete" is as deliberate as "DELETE". */
export function isDeleteConfirmed(typed: string): boolean {
  return typed.trim().toUpperCase() === DELETE_CONFIRMATION_WORD
}

/** States that still bill — and so outlive the account unless cancelled in the store. */
const BILLING_STATUSES: ReadonlyArray<SubscriptionResource['status']> = ['active', 'billing_issue', 'paused']

export function deleteAccountMessage(subscription: SubscriptionResource | null | undefined, storeName: string): string {
  const parts = ['This permanently removes your profile, plans and workout history.']
  if (subscription?.is_sponsored_by_gym) {
    parts.push('Your gym-sponsored access will end.')
  } else if (BILLING_STATUSES.includes(subscription?.status ?? null)) {
    parts.push(`Deleting your account doesn't cancel your subscription. Cancel it in ${storeName} to stop being billed.`)
  }
  parts.push("This can't be undone.")
  return parts.join(' ')
}
