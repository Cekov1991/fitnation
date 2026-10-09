import { describe, expect, it } from 'vitest'
import { entitlementReroute, entryRoute, gateEntitlements, gateRoute, hasBackendAppAccess, purchaseLiftsRefusal } from './gate'

const verified = { email_verified_at: '2026-10-02T10:00:00Z', onboarding_completed_at: null }
const onboarded = { ...verified, onboarding_completed_at: '2026-10-02T10:05:00Z' }

describe('entryRoute', () => {
  it('walks the prerequisites before the gate', () => {
    expect(entryRoute(null, true)).toBe('EmailVerification')
    expect(entryRoute({ email_verified_at: null, onboarding_completed_at: null }, true)).toBe('EmailVerification')
    expect(entryRoute(verified, true)).toBe('Onboarding')
    expect(entryRoute(onboarded, false)).toBe('Paywall')
    expect(entryRoute(onboarded, true)).toBe('Tabs')
  })

  it('gateRoute is the last step on its own', () => {
    expect(gateRoute(false)).toBe('Paywall')
    expect(gateRoute(true)).toBe('Tabs')
  })
})

describe('hasBackendAppAccess', () => {
  it('reads the entitlement straight off the user payload', () => {
    expect(hasBackendAppAccess({ entitlements: ['app_access'] })).toBe(true)
    expect(hasBackendAppAccess({ entitlements: [] })).toBe(false)
    expect(hasBackendAppAccess(null)).toBe(false)
  })
})

describe('gateEntitlements', () => {
  it('trusts RevenueCat or the backend', () => {
    expect(gateEntitlements({ backend: [], store: ['app_access'], backendRefused: false })).toContain('app_access')
    expect(gateEntitlements({ backend: ['app_access'], store: [], backendRefused: false })).toContain('app_access')
    expect(gateEntitlements({ backend: [], store: [], backendRefused: false })).not.toContain('app_access')
  })

  // Ticket 13: a successful sync that still grants nothing beats RevenueCat's cache.
  it('ignores RevenueCat once the backend refused after a sync', () => {
    expect(gateEntitlements({ backend: [], store: ['app_access'], backendRefused: true })).toEqual([])
  })

  it('lets the backend grant through a refusal', () => {
    expect(gateEntitlements({ backend: ['app_access'], store: ['app_access'], backendRefused: true })).toEqual(['app_access'])
  })
})

describe('purchaseLiftsRefusal', () => {
  it('lifts when the backend grants after the purchase or restore', () => {
    expect(purchaseLiftsRefusal({ entitlements: ['app_access'] })).toBe(true)
  })

  it('lifts when no backend answer was seen (fallback: trust RevenueCat)', () => {
    expect(purchaseLiftsRefusal(null)).toBe(true)
  })

  // Otherwise Restore would enter Tabs on RevenueCat's word, 403, and bounce back.
  it('keeps the refusal when the backend answered and still grants nothing', () => {
    expect(purchaseLiftsRefusal({ entitlements: [] })).toBe(false)
  })
})

describe('entitlementReroute', () => {
  it('never overrides a prerequisite screen', () => {
    expect(entitlementReroute('Onboarding', false)).toBeNull()
    expect(entitlementReroute('EmailVerification', false)).toBeNull()
    expect(entitlementReroute(undefined, false)).toBeNull()
  })

  // Finding #5: the hand-over from Onboarding to Tabs, re-checked on arrival.
  it('sends an unentitled user on Tabs (or any gated screen) to the Paywall', () => {
    expect(entitlementReroute('Tabs', false)).toBe('Paywall')
    expect(entitlementReroute('WorkoutSession', false)).toBe('Paywall')
    expect(entitlementReroute('Paywall', false)).toBeNull()
  })

  it('lets an entitled user off the Paywall and leaves them alone elsewhere', () => {
    expect(entitlementReroute('Paywall', true)).toBe('Tabs')
    expect(entitlementReroute('Tabs', true)).toBeNull()
    expect(entitlementReroute('ProgramDetail', true)).toBeNull()
  })
})
