import type { UserResource } from '@fit-nation/shared'
import { Entitlement } from '../lib/entitlements'

/**
 * Where a signed-in person goes, decided in one place. Prerequisites come
 * first (verify the email, finish onboarding), then the subscription gate:
 * Tabs with app access, the Paywall without. AppNavigator uses it for the
 * launch route; the prerequisite screens use it when they hand over, so none
 * of them can land someone on Tabs the gate would not let through.
 */
export type EntryRoute = 'EmailVerification' | 'Onboarding' | 'Paywall' | 'Tabs'
export type GateRoute = Extract<EntryRoute, 'Paywall' | 'Tabs'>

type Prerequisites = Pick<UserResource, 'email_verified_at' | 'onboarding_completed_at'>

export function gateRoute(hasAppAccess: boolean): GateRoute {
  return hasAppAccess ? 'Tabs' : 'Paywall'
}

export function entryRoute(user: Prerequisites | null | undefined, hasAppAccess: boolean): EntryRoute {
  if (!user?.email_verified_at) return 'EmailVerification'
  if (!user.onboarding_completed_at) return 'Onboarding'
  return gateRoute(hasAppAccess)
}

/**
 * The backend's verdict alone, read straight off a `GET /api/user` response.
 * For the moment right after a refresh, when a screen holds the fresh user but
 * useEntitlements has not re-rendered yet. The RevenueCat cache the hook adds
 * only matters offline, and a refresh that just succeeded was online.
 */
export function hasBackendAppAccess(user: Pick<UserResource, 'entitlements'> | null | undefined): boolean {
  return user?.entitlements?.includes(Entitlement.AppAccess) ?? false
}

// Screens that come before the paywall and must never be overridden by it.
const BLOCKING_SCREENS: ReadonlySet<string> = new Set<EntryRoute>(['EmailVerification', 'Onboarding'])

/**
 * The reset EntitlementWatcher performs given the current route, or null to
 * leave the stack alone.
 */
export function entitlementReroute(currentRoute: string | undefined, hasAppAccess: boolean): GateRoute | null {
  if (!currentRoute || BLOCKING_SCREENS.has(currentRoute)) return null
  if (!hasAppAccess && currentRoute !== 'Paywall') return 'Paywall'
  if (hasAppAccess && currentRoute === 'Paywall') return 'Tabs'
  return null
}
