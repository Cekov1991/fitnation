import { describe, expect, it } from 'vitest'
import type { SubscriptionResource } from '@fit-nation/shared'
import { deleteAccountMessage, isDeleteConfirmed } from './deleteAccountCopy'

const sub = (patch: Partial<SubscriptionResource>): SubscriptionResource => ({
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

describe('isDeleteConfirmed', () => {
  it('accepts the word, whatever the case and spacing', () => {
    expect(isDeleteConfirmed('DELETE')).toBe(true)
    expect(isDeleteConfirmed(' delete ')).toBe(true)
  })

  it('rejects anything else, including a prefix or an extra word', () => {
    expect(isDeleteConfirmed('')).toBe(false)
    expect(isDeleteConfirmed('DELET')).toBe(false)
    expect(isDeleteConfirmed('DELETE ME')).toBe(false)
  })
})

describe('deleteAccountMessage', () => {
  it('no plan: what goes, and that it cannot be undone', () => {
    expect(deleteAccountMessage(null, 'Google Play')).toBe(
      "This permanently removes your profile, plans and workout history. This can't be undone."
    )
  })

  it('a gym member is told the sponsored access ends', () => {
    expect(deleteAccountMessage(sub({ is_sponsored_by_gym: true }), 'Google Play')).toBe(
      "This permanently removes your profile, plans and workout history. Your gym-sponsored access will end. This can't be undone."
    )
  })

  it('a plan that still bills is not cancelled by the deletion, and the sheet says where to cancel it', () => {
    for (const status of ['active', 'billing_issue', 'paused'] as const) {
      expect(deleteAccountMessage(sub({ status }), 'the App Store')).toContain(
        "Deleting your account doesn't cancel your subscription. Cancel it in the App Store to stop being billed."
      )
    }
  })

  it('a cancelled or expired plan needs no store sentence', () => {
    for (const status of ['cancelled', 'expired'] as const) {
      expect(deleteAccountMessage(sub({ status }), 'Google Play')).not.toContain('subscription')
    }
  })
})
