import React from 'react'
import { useThemeMode } from '@/contexts/ThemeContext'
import { getColors } from '@/constants/Colors'

export default function LoadingScreen() {
  const { colorScheme } = useThemeMode()
  const Colors = getColors(colorScheme)

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        height: '100vh',
        width: '100vw',
        backgroundColor: Colors.white,
      }}
    >
      <div
        style={{
          fontSize: '18px',
          color: Colors.neutral[600],
          fontFamily: 'Inter, sans-serif',
        }}
      >
        Loading...
      </div>
    </div>
  )
}
