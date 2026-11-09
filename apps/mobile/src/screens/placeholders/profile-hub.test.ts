import { describe, expect, it } from 'vitest'
import { readFileSync } from 'node:fs'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

/**
 * Structural guard for the Profile hub's shape (decided 2026-10-02): the tab
 * offers one prominent way in — subscribing — and nothing else about a plan;
 * managing a plan and deleting the account live on the Account page, the
 * former through its own Subscription page, the latter as a Danger Zone row
 * that opens a sheet confirmed by typing DELETE, never a password. Log out is
 * a settings row on the tab, not a button.
 */
const HERE = dirname(fileURLToPath(import.meta.url))
const read = (rel: string) => readFileSync(join(HERE, rel), 'utf8')

describe('the Profile hub', () => {
  const hub = read('ProfileScreen.tsx')
  const account = read('EditProfileSectionScreen.tsx')
  const sheet = read('../../components/profile/DeleteAccountSheet.tsx')

  // Since 2026-10-12 that includes the Signup Trial, whose days left the card shows.
  it('shows the subscription card only to subscribe, and only while enforced, without the store button', () => {
    expect(hub).toMatch(/\{plan\.shown && plan\.offersPlans && \(/)
    expect(hub).toMatch(/<SubscriptionCard manage=\{false\} onSeePlans=\{\(\) => navigation\.navigate\('SubscriptionPlans'\)\}/)
  })

  it('logs out from a settings row, not a button', () => {
    expect(hub).toMatch(/<ProfileSectionRow icon=\{LogOut\} title="Log out"/)
    expect(hub).not.toMatch(/label="Log Out"/)
  })

  it('no longer deletes the account from the tab', () => {
    expect(hub).not.toMatch(/DeleteAccountSheet|Delete account|useDeleteAccount/)
  })

  it('the Account page owns the Danger Zone and the way to the Subscription page', () => {
    expect(account).toMatch(/<SectionLabel[^>]*>Danger Zone<\/SectionLabel>/)
    expect(account).toMatch(/tone="danger"/)
    expect(account).toMatch(/title="Delete account"/)
    expect(account).toMatch(/<DeleteAccountSheet/)
    expect(account).toMatch(/navigation\.navigate\('Subscription'\)/)
  })

  it('the delete sheet is confirmed by typing DELETE, never a password', () => {
    expect(sheet).toMatch(/isDeleteConfirmed\(/)
    expect(sheet).not.toMatch(/secureTextEntry|requiresPassword/)
    expect(account).not.toMatch(/has_password/)
  })

  // Ticket #96, ADR 0006: a Gym Join is one-way, and the only in-app mention of
  // the way out is this low-prominence settings line. It shows exactly to
  // customers on a Partner (showsChangeGymLine), and never inside the Join
  // Prompt itself.
  it('carries the change-gyms support line, gated to customers on a gym', () => {
    expect(hub).toMatch(/showsChangeGymLine\(/)
    expect(hub).toMatch(/To change gyms, contact support/)
  })

  it('the Join Prompt itself never mentions the support path (ADR 0006)', () => {
    const sheet = read('../../components/partners/JoinGymSheet.tsx')
    expect(sheet).not.toMatch(/contact support|change gyms?/i)
  })

  it('the Subscription page is registered and manages through the shared card', () => {
    expect(read('../../navigation/AppNavigator.tsx')).toMatch(/<Stack\.Screen name="Subscription" component=\{SubscriptionScreen\}/)
    const page = read('SubscriptionScreen.tsx')
    expect(page).toMatch(/<ScreenHeader title="Subscription"/)
    expect(page).toMatch(/<SubscriptionCard onSeePlans=/)
  })
})
