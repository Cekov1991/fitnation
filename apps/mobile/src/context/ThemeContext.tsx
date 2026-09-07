import React, { createContext, useCallback, useContext, useState } from 'react'
import { useColorScheme } from 'react-native'
import { lightColors, darkColors, type AppColors } from '../constants/theme'

interface ThemeContextValue {
  colors: AppColors
  /**
   * Replace the Partner overrides wholesale — `{}` is the default palette.
   * Replacing rather than merging is what stops one Partner's colours from
   * bleeding into the next account on the same phone (0017).
   */
  setColors: (colors: Partial<AppColors>) => void
  resetColors: () => void
}

const ThemeContext = createContext<ThemeContextValue>({
  colors: lightColors,
  setColors: () => {},
  resetColors: () => {},
})

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const scheme = useColorScheme()
  const [overrides, setOverrides] = useState<Partial<AppColors>>({})

  const colors = { ...(scheme === 'dark' ? darkColors : lightColors), ...overrides }

  const setColors = useCallback((overrides: Partial<AppColors>) => setOverrides(overrides), [])
  const resetColors = useCallback(() => setOverrides({}), [])

  return (
    <ThemeContext.Provider value={{ colors, setColors, resetColors }}>
      {children}
    </ThemeContext.Provider>
  )
}

export function useTheme() {
  return useContext(ThemeContext)
}
