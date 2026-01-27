import React, { createContext, useContext, useState, useEffect, ReactNode, useMemo } from 'react'

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
