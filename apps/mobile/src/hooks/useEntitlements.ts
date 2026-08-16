import { useCallback, useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import { authApi } from '@fit-nation/shared'
import Purchases from 'react-native-purchases'
import { useAuth } from '../context/AuthContext'

export const Entitlement = { AppAccess: 'app_access' } as const
export type Entitlement = (typeof Entitlement)[keyof typeof Entitlement]

export function useEntitlements() {
  const { user: authUser } = useAuth()

  const userQuery = useQuery({
    queryKey: ['user'],
    queryFn: () => authApi.getCurrentUser().then(r => r.user),
    initialData: authUser ?? undefined,
    enabled: !!authUser,
  })

  // RC's locally-cached customerInfo. Used as an offline fallback so the
  // paywall doesn't lock out a paying user when the backend is unreachable.
  const rcQuery = useQuery({
    queryKey: ['rc-customer-info'],
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
