import React, { createContext, useContext, useState } from 'react'
import { useColorScheme } from 'react-native'
import { DarkColors, LightColors, AppColors } from './theme'

export type ThemeMode = 'system' | 'light' | 'dark'

interface ThemeContextValue {
  colors: AppColors
  isDark: boolean
  themeMode: ThemeMode
  setThemeMode: (mode: ThemeMode) => void
  toggleTheme: () => void
}

const ThemeContext = createContext<ThemeContextValue>({
  colors: DarkColors,
  isDark: true,
  themeMode: 'system',
  setThemeMode: () => {},
  toggleTheme: () => {},
})

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const systemScheme = useColorScheme()
  const [themeMode, setThemeMode] = useState<ThemeMode>('system')

  const isDark = themeMode === 'system' ? systemScheme !== 'light' : themeMode === 'dark'
  const colors = isDark ? DarkColors : LightColors

  function toggleTheme() {
    setThemeMode(prev => {
      if (prev === 'system') return isDark ? 'light' : 'dark'
      return prev === 'dark' ? 'light' : 'dark'
    })
  }

  return (
    <ThemeContext.Provider value={{ colors, isDark, themeMode, setThemeMode, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  )
}

export function useTheme() {
  return useContext(ThemeContext)
}
