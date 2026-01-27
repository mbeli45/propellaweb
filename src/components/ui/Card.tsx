import React from 'react'
import { useThemeMode } from '@/contexts/ThemeContext'
import { getColors } from '@/constants/Colors'

interface CardProps {
  children: React.ReactNode
  style?: React.CSSProperties
  variant?: 'elevated' | 'outlined' | 'filled'
}

export default function Card({
  children,
  style,
  variant = 'elevated',
}: CardProps) {
  const { colorScheme } = useThemeMode()
  const Colors = getColors(colorScheme)

  const getCardStyle = (): React.CSSProperties => {
    const baseStyle: React.CSSProperties = {
      borderRadius: '8px',
      padding: '16px',
      marginVertical: '8px',
    }

    if (variant === 'elevated') {
      baseStyle.backgroundColor = Colors.white
      baseStyle.boxShadow = '0 2px 8px rgba(0, 0, 0, 0.1)'
    } else if (variant === 'outlined') {
      baseStyle.backgroundColor = Colors.white
      baseStyle.border = `1px solid ${Colors.neutral[200]}`
    } else if (variant === 'filled') {
      baseStyle.backgroundColor = Colors.neutral[50]
    }

    return { ...baseStyle, ...style }
  }

  return (
    <div style={getCardStyle()}>
      {children}
    </div>
  )
}
