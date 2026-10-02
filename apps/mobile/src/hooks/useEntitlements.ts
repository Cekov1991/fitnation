import { useCallback, useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import { authApi, queryKeys } from '@fit-nation/shared'
import Purchases from 'react-native-purchases'
import { useAuth } from '../context/AuthContext'
import { Entitlement } from '../lib/entitlements'

export { Entitlement } from '../lib/entitlements'

export function useEntitlements() {
  const { user: authUser } = useAuth()

  const userQuery = useQuery({
    queryKey: queryKeys.user.current(),
    queryFn: () => authApi.getCurrentUser().then(r => r.user),
    initialData: authUser ?? undefined,
    enabled: !!authUser,
  })

  // RC's locally-cached customerInfo. Used as an offline fallback so the
  // paywall doesn't lock out a paying user when the backend is unreachable.
  const rcQuery = useQuery({
    queryKey: queryKeys.revenueCat.customerInfo(),
    queryFn: () => Purchases.getCustomerInfo(),
    enabled: !!authUser,
    staleTime: 60_000,
    retry: false,
  })

  const entitlements = useMemo(() => {
    const beEntitlements = userQuery.data?.entitlements ?? []
    const rcEntitlements = Object.keys(rcQuery.data?.entitlements.active ?? {})
    return Array.from(new Set([...beEntitlements, ...rcEntitlements]))
  }, [userQuery.data, rcQuery.data])

  const has = useCallback(
    (e: Entitlement | string) => entitlements.includes(e),
    [entitlements],
  )

  return {
    entitlements,
    subscription: userQuery.data?.subscription ?? null,
    isLoading: userQuery.isLoading && rcQuery.isLoading,
    has,
  }
}
