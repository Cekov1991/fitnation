import { describe, expect, it } from 'vitest'
import { readFileSync } from 'node:fs'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

/**
 * Structural guard for the subscription gate (finding #5, 2026-10-02): every
 * hand-over into the app goes through ./gate, and the watcher re-checks on
 * route changes, not only on entitlement changes. A bare `'Tabs'` destination
 * in a prerequisite screen is how a new user ended up on a Dashboard of 403s.
 */
const HERE = dirname(fileURLToPath(import.meta.url))
const read = (rel: string) => readFileSync(join(HERE, rel), 'utf8')

describe('the subscription gate decides every entry route', () => {
  it('AppNavigator takes its launch route from entryRoute', () => {
    expect(read('AppNavigator.tsx')).toMatch(/initialRouteName = entryRoute\(user, has\(Entitlement\.AppAccess\)\)/)
  })

  it('Onboarding hands over through gateRoute, never to a literal Tabs', () => {
    const src = read('../screens/placeholders/OnboardingScreen.tsx')
    expect(src).toMatch(/gateRoute\(hasBackendAppAccess\(/)
    expect(src).not.toMatch(/replace\('Tabs'\)/)
  })

  it('EmailVerification hands over through entryRoute', () => {
    const src = read('../screens/placeholders/EmailVerificationScreen.tsx')
    expect(src).toMatch(/name: entryRoute\(user, has\(Entitlement\.AppAccess\)\)/)
    expect(src).not.toMatch(/'Tabs'/)
  })

  it('EntitlementWatcher re-checks on every navigation state change', () => {
    expect(read('EntitlementWatcher.tsx')).toMatch(/addListener\('state', reroute\)/)
  })
})
