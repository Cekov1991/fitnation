import { useEffect } from 'react'
import type { NavigationContainerRef } from '@react-navigation/native'
import { useEntitlements, Entitlement } from '../hooks/useEntitlements'
import { useAuth } from '../context/AuthContext'
import type { AppStackParamList } from './types'

// Screens we must never override — they represent prerequisites that come
// before the paywall (verify email, finish onboarding).
const BLOCKING_SCREENS = new Set(['EmailVerification', 'Onboarding'])

interface Props {
  navRef: React.RefObject<NavigationContainerRef<AppStackParamList> | null>
}

/**
 * Reroutes the user between Tabs and Paywall whenever entitlements change at
 * runtime — e.g. after a successful purchase webhook lands, after a refund,
 * after a sandbox expiration, or after the user is sponsored by a partner.
 */
export function EntitlementWatcher({ navRef }: Props) {
  const { user } = useAuth()
  const { entitlements } = useEntitlements()
  const hasAppAccess = entitlements.includes(Entitlement.AppAccess)

  useEffect(() => {
    if (!user) return
    const nav = navRef.current
    if (!nav?.isReady()) return

    const current = nav.getCurrentRoute()
    if (!current || BLOCKING_SCREENS.has(current.name)) return

    if (!hasAppAccess && current.name !== 'Paywall') {
      nav.reset({ index: 0, routes: [{ name: 'Paywall' }] })
    } else if (hasAppAccess && current.name === 'Paywall') {
      nav.reset({ index: 0, routes: [{ name: 'Tabs' }] })
    }
  }, [user, hasAppAccess, navRef])

  return null
}
