import React, { createContext, useContext, useState, useEffect, useRef } from 'react'
import { AppState, type AppStateStatus } from 'react-native'
import * as SecureStore from 'expo-secure-store'
import { initAuth, AUTH_TOKEN_KEY, authApi } from '@fit-nation/shared'
import type { UserResource } from '@fit-nation/shared'
import { useTheme } from './ThemeContext'

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
  logout: () => Promise<void>
  setUser: (user: UserResource | null) => void
  refreshUser: () => Promise<void>
}

const AuthContext = createContext<AuthContextValue>({
  user: null,
  isLoading: true,
  login: async () => {},
  logout: async () => {},
  setUser: () => {},
  refreshUser: async () => {},
})

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<UserResource | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const { setColors } = useTheme()
  const appStateRef = useRef<AppStateStatus>(AppState.currentState)

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
  }

  async function logout() {
    await authApi.logout()
    await SecureStore.deleteItemAsync(AUTH_TOKEN_KEY)
    setUser(null)
  }

  async function refreshUser() {
    const { user: currentUser } = await authApi.getCurrentUser()
    applyPartnerColors(currentUser)
    setUser(currentUser)
  }

  return (
    <AuthContext.Provider value={{ user, isLoading, login, logout, setUser, refreshUser }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  return useContext(AuthContext)
}
