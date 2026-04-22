import React, { createContext, useContext, useState } from 'react'
import { useColorScheme } from 'react-native'
import { DarkColors, LightColors, AppColors } from './theme'

interface ThemeContextValue {
  colors: AppColors
  isDark: boolean
  toggleTheme: () => void
}

const ThemeContext = createContext<ThemeContextValue>({
  colors: DarkColors,
  isDark: true,
  toggleTheme: () => {},
})

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const systemScheme = useColorScheme()
  const [manualDark, setManualDark] = useState<boolean | null>(null)

  const isDark = manualDark !== null ? manualDark : systemScheme !== 'light'
  const colors = isDark ? DarkColors : LightColors

  function toggleTheme() {
    setManualDark(prev => (prev !== null ? !prev : !isDark))
  }

  return (
    <ThemeContext.Provider value={{ colors, isDark, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  )
}

export function useTheme() {
  return useContext(ThemeContext)
}
