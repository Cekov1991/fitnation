import React, { createContext, useContext, useState, useEffect, useRef, useCallback } from 'react'
import { AppState, type AppStateStatus } from 'react-native'
import { useQueryClient } from '@tanstack/react-query'
import * as SecureStore from 'expo-secure-store'
import { initAuth, setOnUnauthorized, setOnSubscriptionRequired, AUTH_TOKEN_KEY, authApi } from '@fit-nation/shared'
import { GoogleSignin } from '@react-native-google-signin/google-signin'
import type { UserResource } from '@fit-nation/shared'
import { useTheme } from './ThemeContext'
import { identifyRevenueCatUser, logOutRevenueCat } from '../lib/revenuecat'

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
  refreshUser: () => Promise<void>
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
  refreshUser: async () => {},
})

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUserState] = useState<UserResource | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const { setColors } = useTheme()
  const queryClient = useQueryClient()
  const appStateRef = useRef<AppStateStatus>(AppState.currentState)

  // Keep AuthContext and the TanStack ['user'] cache in lockstep so that
  // useEntitlements (which reads from the query cache) always sees the latest
  // entitlements/subscription after login, refresh, or foreground sync.
  const setUser = useCallback((nextUser: UserResource | null) => {
    setUserState(nextUser)
    if (nextUser) {
      queryClient.setQueryData(['user'], nextUser)
    } else {
      queryClient.removeQueries({ queryKey: ['user'] })
    }
  }, [queryClient])

  // Server rejected the token (deleted user, revoked session, expired token).
  // Clear cached state and drop back to the auth navigator.
  useEffect(() => {
    setOnUnauthorized(() => {
      setUser(null)
      queryClient.clear()
    })
    return () => setOnUnauthorized(null)
  }, [queryClient, setUser])

  // A gated endpoint returned 403 subscription_required — entitlements changed
  // server-side while the cached user still granted access. Refresh both
  // entitlement sources; EntitlementWatcher reroutes to the paywall once the
  // fresh user lands. GET /api/user is pre-paywall, so this cannot loop.
  useEffect(() => {
    setOnSubscriptionRequired(() => {
      queryClient.invalidateQueries({ queryKey: ['user'] })
      queryClient.invalidateQueries({ queryKey: ['rc-customer-info'] })
    })
    return () => setOnSubscriptionRequired(null)
  }, [queryClient])

  function applyPartnerColors(currentUser: UserResource) {
    const identity = currentUser.partner?.visual_identity
    if (!identity) return
    // Mirror web behavior: only override primary/secondary brand colors.
    // Background, card, text, and border colors stay at their CSS defaults
    // so the mobile surface palette matches the web light theme.
    setColors({
      ...(identity.primary_color ? { primary: identity.primary_color } : {}),
      ...(identity.secondary_color ? { secondary: identity.secondary_color } : {}),
    })
  }

  useEffect(() => {
    async function loadUser() {
      try {
        const token = await SecureStore.getItemAsync(AUTH_TOKEN_KEY)
        if (token) {
          const { user: currentUser } = await authApi.getCurrentUser()
          applyPartnerColors(currentUser)
          setUser(currentUser)
          await identifyRevenueCatUser(String(currentUser.id))
        }
      } catch {
        await SecureStore.deleteItemAsync(AUTH_TOKEN_KEY)
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
          applyPartnerColors(currentUser)
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
    applyPartnerColors(fullUser)
    setUser(fullUser)
    await identifyRevenueCatUser(String(fullUser.id))
  }

  async function loginWithSocial(provider: 'google' | 'apple', token: string, name?: string) {
    const response = await authApi.socialLogin({ provider, token, name })
    await SecureStore.setItemAsync(AUTH_TOKEN_KEY, response.token)
    const { user: fullUser } = await authApi.getCurrentUser()
    applyPartnerColors(fullUser)
    setUser(fullUser)
    await identifyRevenueCatUser(String(fullUser.id))
  }

  async function logout() {
    const token = await SecureStore.getItemAsync(AUTH_TOKEN_KEY).catch(() => null)
    if (token) {
      try {
        await authApi.logout()
      } catch {
        // Continue with local logout even if the server call fails (token
        // already revoked, account deleted, network down, etc).
      }
    }
    await SecureStore.deleteItemAsync(AUTH_TOKEN_KEY)
    // Reset RevenueCat to an anonymous user so the next account on this device
    // doesn't inherit this user's purchase identity. Guarded like the calls
    // below: local logout must always complete.
    try { await logOutRevenueCat() } catch {}
    // Sign out from Google so the account picker appears on next social login
    try { await GoogleSignin.signOut() } catch {}
    queryClient.clear()
    setUser(null)
  }

  async function refreshUser() {
    const { user: currentUser } = await authApi.getCurrentUser()
    applyPartnerColors(currentUser)
    setUser(currentUser)
  }

  return (
    <AuthContext.Provider value={{ user, isLoading, login, loginWithSocial, logout, setUser, refreshUser }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  return useContext(AuthContext)
}
