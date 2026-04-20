import React, { createContext, useContext, useState } from 'react'
import { defaultColors, type AppColors } from '../constants/theme'

interface ThemeContextValue {
  colors: AppColors
  setColors: (colors: Partial<AppColors>) => void
}

const ThemeContext = createContext<ThemeContextValue>({
  colors: defaultColors,
  setColors: () => {},
})

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [colors, setColorsState] = useState<AppColors>(defaultColors)

  function setColors(partial: Partial<AppColors>) {
    setColorsState(prev => ({ ...prev, ...partial }))
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
