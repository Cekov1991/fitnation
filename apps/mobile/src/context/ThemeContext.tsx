import React, { createContext, useContext, useState } from 'react'
import { useColorScheme } from 'react-native'
import { lightColors, darkColors, type AppColors } from '../constants/theme'

interface ThemeContextValue {
  colors: AppColors
  setColors: (colors: Partial<AppColors>) => void
}

const ThemeContext = createContext<ThemeContextValue>({
  colors: lightColors,
  setColors: () => {},
})

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const scheme = useColorScheme()
  const [overrides, setOverrides] = useState<Partial<AppColors>>({})

  const colors = { ...(scheme === 'dark' ? darkColors : lightColors), ...overrides }

  function setColors(partial: Partial<AppColors>) {
    setOverrides(prev => ({ ...prev, ...partial }))
  }

  return (
    <ThemeContext.Provider value={{ colors, setColors }}>
      {children}
    </ThemeContext.Provider>
  )
}

export function useTheme() {
  return useContext(ThemeContext)
}
