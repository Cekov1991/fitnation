import React, { createContext, useContext, useState, useEffect, useRef, useCallback } from 'react'
import { AppState, type AppStateStatus } from 'react-native'
import { hashKey, useQueryClient } from '@tanstack/react-query'
import * as SecureStore from 'expo-secure-store'
import { initAuth, setOnUnauthorized, setOnSubscriptionRequired, AUTH_TOKEN_KEY, authApi, queryKeys } from '@fit-nation/shared'
import { GoogleSignin } from '@react-native-google-signin/google-signin'
import type { UserResource } from '@fit-nation/shared'
import { useDeviceRegistration, clearLastDeviceRegistration } from '../hooks/useDeviceRegistration'
import { identifyRevenueCatUser, logOutRevenueCat, revenueCatGrantsAppAccess } from '../lib/revenuecat'
import { createSubscriptionRecovery } from '../lib/subscriptionRecovery'
import { hasBackendAppAccess } from '../navigation/gate'
import { restoreSession } from '../lib/session'
import { readCachedUser, writeCachedUser } from '../lib/userCache'

// Wire up storage injection (called once at module load)
initAuth({
  storage: {
    getItem: (key) => SecureStore.getItemAsync(key),
    setItem: (key, value) => SecureStore.setItemAsync(key, value),
    removeItem: (key) => SecureStore.deleteItemAsync(key),
  }
})

interface AuthContextValue {
  user: UserResource | null
  isLoading: boolean
  login: (email: string, password: string) => Promise<void>
  loginWithSocial: (provider: 'google' | 'apple', token: string, name?: string) => Promise<void>
  logout: () => Promise<void>
  setUser: (user: UserResource | null) => void
  /** Re-reads GET /api/user into the context and returns it, for callers that must route on the fresh answer. */
  refreshUser: () => Promise<UserResource | null>
  /**
   * A Subscription Sync answered and the backend still granted nothing, so the
   * gate ignores RevenueCat's cache (ticket 026/13). Lifted by a `/user` with
   * access, a purchase or restore, or a change of user.
   */
  backendRefused: boolean
  /** A purchase or restore went through: trust RevenueCat again. */
  liftBackendRefusal: () => void
}

// Configure Google Sign-In once at module load
GoogleSignin.configure({
  iosClientId: process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID,
  webClientId: process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID,
})

const AuthContext = createContext<AuthContextValue>({
  user: null,
  isLoading: true,
  login: async () => {},
  loginWithSocial: async () => {},
  logout: async () => {},
  setUser: () => {},
  refreshUser: async () => null,
  backendRefused: false,
  liftBackendRefusal: () => {},
})

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUserState] = useState<UserResource | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [backendRefused, setBackendRefused] = useState(false)
  const liftBackendRefusal = useCallback(() => setBackendRefused(false), [])
  const queryClient = useQueryClient()
  const appStateRef = useRef<AppStateStatus>(AppState.currentState)

  // Device heartbeat: registers this phone for push once the user is set,
  // onboarded and has granted permission. See useDeviceRegistration.
  useDeviceRegistration(user)

  // Keep AuthContext and the TanStack user query in lockstep so that
  // useEntitlements (which reads from the query cache) always sees the latest
  // entitlements/subscription after login, refresh, or foreground sync.
  const setUser = useCallback((nextUser: UserResource | null) => {
    setUserState(nextUser)
    if (nextUser) {
      queryClient.setQueryData(queryKeys.user.current(), nextUser)
    } else {
      queryClient.removeQueries({ queryKey: queryKeys.user.current() })
    }
    // The last payload we saw, for booting offline (finding #4). Best effort.
    void writeCachedUser(nextUser)
  }, [queryClient])

  // Server rejected the token (deleted user, revoked session, expired token).
  // Clear cached state and drop back to the auth navigator.
  useEffect(() => {
    setOnUnauthorized(() => {
      setUser(null)
      queryClient.clear()
      clearLastDeviceRegistration()
    })
    return () => setOnUnauthorized(null)
  }, [queryClient, setUser])

  // A `/user` with access, however it arrived (setUser, a refetch), lifts a
  // backend refusal.
  useEffect(() => {
    const userHash = hashKey(queryKeys.user.current())
    return queryClient.getQueryCache().subscribe((event) => {
      if (event.type === 'updated' && event.query.queryHash === userHash && hasBackendAppAccess(event.query.state.data as UserResource | undefined)) {
        setBackendRefused(false)
      }
    })
  }, [queryClient])

  // A gated endpoint returned 403 subscription_required: re-sync the backend
  // if RevenueCat says the user paid, else refresh both entitlement sources so
  // EntitlementWatcher can reroute. A sync that answers without access is the
  // backend's refusal: the gate then sends the user to the paywall even though
  // RevenueCat grants (ticket 13). See createSubscriptionRecovery (no loop).
  // One recovery per signed-in user; a late answer for a previous one is dropped.
  const userId = user?.id
  useEffect(() => {
    let current = true
    const recover = createSubscriptionRecovery({
      storeGrantsAccess: revenueCatGrantsAppAccess,
      sync: () => authApi.syncSubscription(),
      onRecovered: (fresh) => {
        if (!current) return
        setUser(fresh)
        const userHash = hashKey(queryKeys.user.current())
        queryClient.invalidateQueries({ predicate: (q) => q.queryHash !== userHash })
      },
      onRefused: (synced) => {
        if (!current) return
        setUser(synced)
        setBackendRefused(true)
      },
      onUnrecovered: () => {
        if (!current) return
        queryClient.invalidateQueries({ queryKey: queryKeys.user.current() })
        queryClient.invalidateQueries({ queryKey: queryKeys.revenueCat.customerInfo() })
      },
      log: (message, error) => console.warn(message, error),
    })
    // Not awaited: the failing request rejects at once; recovery runs behind it.
    setOnSubscriptionRequired(() => { void recover() })
    return () => {
      current = false
      setOnSubscriptionRequired(null)
      setBackendRefused(false)
    }
  }, [queryClient, setUser, userId])

  // Boot: restore the session from the stored token. Only a rejected token
  // signs out (the HTTP layer has already dropped it); no network falls back
  // to the last user payload, so a relaunch in airplane mode is still in
  // (finding #4). See restoreSession for the cases.
  useEffect(() => {
    async function loadUser() {
      try {
        const token = await SecureStore.getItemAsync(AUTH_TOKEN_KEY).catch(() => null)
        const session = await restoreSession({
          token,
          fetchUser: () => authApi.getCurrentUser().then(r => r.user),
          readCachedUser,
        })
        if (session.kind === 'online' || session.kind === 'offline') {
          setUser(session.user)
          await identifyRevenueCatUser(String(session.user.id))
        }
      } finally {
        setIsLoading(false)
      }
    }
    loadUser()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Refresh user when app returns to foreground (so email_verified_at updates automatically)
  useEffect(() => {
    const subscription = AppState.addEventListener('change', async (nextState: AppStateStatus) => {
      const prev = appStateRef.current
      appStateRef.current = nextState
      if (nextState === 'active' && prev !== 'active') {
        const token = await SecureStore.getItemAsync(AUTH_TOKEN_KEY).catch(() => null)
        if (!token) return
        try {
          const { user: currentUser } = await authApi.getCurrentUser()
          setUser(currentUser)
        } catch {
          // silent — token may have been revoked; auth guard will handle the next protected request
        }
      }
    })
    return () => subscription.remove()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  async function login(email: string, password: string) {
    const response = await authApi.login(email, password)
    await SecureStore.setItemAsync(AUTH_TOKEN_KEY, response.token)
    // Re-fetch after the token is stored — the login response may omit fields
    // like onboarding_completed_at that the navigation logic depends on.
    const { user: fullUser } = await authApi.getCurrentUser()
    setUser(fullUser)
    await identifyRevenueCatUser(String(fullUser.id))
  }

  async function loginWithSocial(provider: 'google' | 'apple', token: string, name?: string) {
    const response = await authApi.socialLogin({ provider, token, name })
    await SecureStore.setItemAsync(AUTH_TOKEN_KEY, response.token)
    const { user: fullUser } = await authApi.getCurrentUser()
    setUser(fullUser)
    await identifyRevenueCatUser(String(fullUser.id))
  }

  // One run at a time: a second tap while the first is in flight joins it
  // instead of starting the sequence again (finding #8).
  const logoutRef = useRef<Promise<void> | null>(null)
  function logout(): Promise<void> {
    if (!logoutRef.current) {
      logoutRef.current = performLogout().finally(() => { logoutRef.current = null })
    }
    return logoutRef.current
  }

  async function performLogout() {
    const token = await SecureStore.getItemAsync(AUTH_TOKEN_KEY).catch(() => null)
    // Start the remote clean-up first — RevenueCat switches to an anonymous
    // user the moment it is called, so a quick sign-in as another account
    // afterwards cannot be undone by it — then sign out locally without
    // waiting on any of it, so the screen answers the tap at once. Every
    // remote call is best effort: token already revoked, account deleted,
    // network down, Google never signed in.
    const remote = Promise.allSettled([
      token ? authApi.logout() : Promise.resolve(),
      // Reset RevenueCat so the next account on this device doesn't inherit
      // this user's purchase identity.
      logOutRevenueCat(),
      // Sign out from Google so the account picker appears on next social login.
      Promise.resolve().then(() => GoogleSignin.signOut()),
    ])
    queryClient.clear()
    setUser(null)
    await remote
    // Drop the token only if it is still this session's: a quick sign-in as
    // another account may have stored a new one meanwhile.
    const current = await SecureStore.getItemAsync(AUTH_TOKEN_KEY).catch(() => null)
    if (current !== null && current === token) await SecureStore.deleteItemAsync(AUTH_TOKEN_KEY)
    // No unregister call: the server ends the Device with the revoked token.
    // Forget the heartbeat record so a different user on this phone registers
    // immediately instead of waiting out the throttle.
    await clearLastDeviceRegistration()
  }

  async function refreshUser() {
    const { user: currentUser } = await authApi.getCurrentUser()
    setUser(currentUser)
    return currentUser
  }

  return (
    <AuthContext.Provider value={{ user, isLoading, login, loginWithSocial, logout, setUser, refreshUser, backendRefused, liftBackendRefusal }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  return useContext(AuthContext)
}
