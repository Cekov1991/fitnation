import React, { createContext, useContext, useMemo } from 'react'
import { useColorScheme } from 'react-native'
import { partnerColorOverrides, type ColorScheme } from '@fit-nation/shared'
import { lightColors, darkColors, type AppColors } from '../constants/theme'
import { useAuth } from './AuthContext'

interface ThemeContextValue {
  colors: AppColors
  scheme: ColorScheme
}

const ThemeContext = createContext<ThemeContextValue>({ colors: lightColors, scheme: 'light' })

/**
 * The resolved visual identity for this session (0029).
 *
 * Derived from auth state, not pushed into it: a Partner's colours appear when
 * their user is signed in and are gone the moment `user` is null — 0017's
 * reset by construction — and the only ordering rule is "inside AuthProvider",
 * which the import direction now states. Memoised so the ~70 consumers of
 * useTheme() re-render only when the identity or the colour scheme changes,
 * not on every render of this provider.
 */
export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const scheme: ColorScheme = useColorScheme() === 'dark' ? 'dark' : 'light'
  const { user } = useAuth()
  const identity = user?.partner?.visual_identity ?? null

  const colors = useMemo<AppColors>(
    () => ({ ...(scheme === 'dark' ? darkColors : lightColors), ...partnerColorOverrides(user, scheme) }),
    // `identity` is what the overrides read; `user` changing otherwise is not a new palette.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [identity, scheme]
  )
  const value = useMemo(() => ({ colors, scheme }), [colors, scheme])

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
}

export function useTheme() {
  return useContext(ThemeContext)
}
