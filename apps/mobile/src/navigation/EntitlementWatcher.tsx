import { useCallback, useEffect } from 'react'
import type { NavigationContainerRef } from '@react-navigation/native'
import { useEntitlements, Entitlement } from '../hooks/useEntitlements'
import { useAuth } from '../context/AuthContext'
import { entitlementReroute } from './gate'
import type { AppStackParamList } from './types'

interface Props {
  navRef: React.RefObject<NavigationContainerRef<AppStackParamList> | null>
}

/**
 * Keeps the stack on the right side of the subscription gate at runtime:
 * Tabs with app access, the Paywall without. The decision itself is
 * entitlementReroute() in ./gate.
 */
export function EntitlementWatcher({ navRef }: Props) {
  const { user } = useAuth()
  const { entitlements } = useEntitlements()
  const hasAppAccess = entitlements.includes(Entitlement.AppAccess)

  const reroute = useCallback(() => {
    if (!user) return
    const nav = navRef.current
    if (!nav?.isReady()) return
    const target = entitlementReroute(nav.getCurrentRoute()?.name, hasAppAccess)
    if (target) nav.reset({ index: 0, routes: [{ name: target }] })
  }, [user, hasAppAccess, navRef])

  // Entitlements changed under a stable route: a purchase webhook landed, a
  // refund or a sandbox expiry came through, a partner started sponsoring.
  useEffect(reroute, [reroute])

  // The route changed under stable entitlements: a prerequisite screen handed
  // over to Tabs, or a deep link landed somewhere. Until this listener existed
  // the hand-over was never re-checked, so a new user without a subscription
  // sat on Tabs full of 403s until the next foreground refresh (finding #5).
  useEffect(() => navRef.current?.addListener('state', reroute), [navRef, reroute])

  return null
}
