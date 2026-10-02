import { describe, expect, it } from 'vitest'
import { readFileSync } from 'node:fs'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

/**
 * Structural guard for the Profile hub's shape (decided 2026-10-02): the tab
 * offers one prominent way in — subscribing — and nothing else about a plan;
 * managing a plan and deleting the account live on the Account page, the
 * former through its own Subscription page.
 */
const HERE = dirname(fileURLToPath(import.meta.url))
const read = (rel: string) => readFileSync(join(HERE, rel), 'utf8')

describe('the Profile hub', () => {
  const hub = read('ProfileScreen.tsx')
  const account = read('EditProfileSectionScreen.tsx')

  it('shows the subscription card only to subscribe, without the store button', () => {
    expect(hub).toMatch(/\{!hasAccess && \(/)
    expect(hub).toMatch(/<SubscriptionCard manage=\{false\}/)
  })

  it('no longer deletes the account from the tab', () => {
    expect(hub).not.toMatch(/DeleteAccountDialog|Delete Account|useDeleteAccount/)
  })

  it('the Account page owns Delete Account and the way to the Subscription page', () => {
    expect(account).toMatch(/<DeleteAccountDialog/)
    expect(account).toMatch(/label="Delete Account"/)
    expect(account).toMatch(/navigation\.navigate\('Subscription'\)/)
  })

  it('the Subscription page is registered and manages through the shared card', () => {
    expect(read('../../navigation/AppNavigator.tsx')).toMatch(/<Stack\.Screen name="Subscription" component=\{SubscriptionScreen\}/)
    const page = read('SubscriptionScreen.tsx')
    expect(page).toMatch(/<ScreenHeader title="Subscription"/)
    expect(page).toMatch(/<SubscriptionCard onSeePlans=/)
  })
})
