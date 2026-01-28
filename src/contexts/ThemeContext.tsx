import React, { createContext, useContext, useState, useEffect, ReactNode, useMemo } from 'react'
import { getColors } from '@/constants/Colors'

export type ThemeMode = 'light' | 'dark' | 'auto'

interface ThemeContextProps {
  mode: ThemeMode
  colorScheme: 'light' | 'dark'
  setMode: (mode: ThemeMode) => void
}

const ThemeContext = createContext<ThemeContextProps>({
  mode: 'light',
  colorScheme: 'light',
  setMode: () => {},
})

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [mode, setMode] = useState<ThemeMode>('light')
  const [colorScheme, setColorScheme] = useState<'light' | 'dark'>('light')

  useEffect(() => {
    if (mode === 'auto') {
      const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)')
      const handler = (e: MediaQueryListEvent) => {
        setColorScheme(e.matches ? 'dark' : 'light')
      }
      setColorScheme(mediaQuery.matches ? 'dark' : 'light')
      mediaQuery.addEventListener('change', handler)
      return () => mediaQuery.removeEventListener('change', handler)
    } else {
      setColorScheme(mode)
    }
  }, [mode])

  // Set data-theme attribute and CSS variables on document root
  useEffect(() => {
    const Colors = getColors(colorScheme)

    // Set data-theme attribute
    document.documentElement.setAttribute('data-theme', colorScheme)
    if (colorScheme === 'dark') {
      document.documentElement.classList.add('dark')
      document.documentElement.classList.remove('light')
    } else {
      document.documentElement.classList.add('light')
      document.documentElement.classList.remove('dark')
    }

    // Set CSS variables for colors
    const root = document.documentElement
    root.style.setProperty('--color-white', Colors.white)
    root.style.setProperty('--color-black', Colors.black)
    root.style.setProperty('--color-neutral-50', Colors.neutral[50])
    root.style.setProperty('--color-neutral-100', Colors.neutral[100])
    root.style.setProperty('--color-neutral-200', Colors.neutral[200])
    root.style.setProperty('--color-neutral-300', Colors.neutral[300])
    root.style.setProperty('--color-neutral-400', Colors.neutral[400])
    root.style.setProperty('--color-neutral-500', Colors.neutral[500])
    root.style.setProperty('--color-neutral-600', Colors.neutral[600])
    root.style.setProperty('--color-neutral-700', Colors.neutral[700])
    root.style.setProperty('--color-neutral-800', Colors.neutral[800])
    root.style.setProperty('--color-neutral-900', Colors.neutral[900])
    root.style.setProperty('--color-primary-50', Colors.primary[50])
    root.style.setProperty('--color-primary-100', Colors.primary[100])
    root.style.setProperty('--color-primary-200', Colors.primary[200])
    root.style.setProperty('--color-primary-300', Colors.primary[300])
    root.style.setProperty('--color-primary-400', Colors.primary[400])
    root.style.setProperty('--color-primary-500', Colors.primary[500])
    root.style.setProperty('--color-primary-600', Colors.primary[600])
    root.style.setProperty('--color-primary-700', Colors.primary[700])
    root.style.setProperty('--color-primary-800', Colors.primary[800])
    root.style.setProperty('--color-primary-900', Colors.primary[900])
    root.style.setProperty('--color-success-600', Colors.success[600])
    root.style.setProperty('--color-error-600', Colors.error[600])
    root.style.setProperty('--color-warning-600', Colors.warning[600])
  }, [colorScheme])

  const contextValue = useMemo(() => ({
    mode,
    colorScheme,
    setMode,
  }), [mode, colorScheme])

  return (
    <ThemeContext.Provider value={contextValue}>
      {children}
    </ThemeContext.Provider>
  )
}

export function useThemeMode() {
  return useContext(ThemeContext)
}
