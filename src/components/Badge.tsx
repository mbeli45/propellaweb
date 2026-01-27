import React from 'react'
import { getColors } from '@/constants/Colors'
import { useThemeMode } from '@/contexts/ThemeContext'

interface BadgeProps {
  count: number
  size?: 'small' | 'medium' | 'large'
  color?: string
}

export default function Badge({ count, size = 'medium', color }: BadgeProps) {
  const { colorScheme } = useThemeMode()
  const Colors = getColors(colorScheme)
  
  if (count === 0) return null

  const sizeStyles = {
    small: {
      width: '16px',
      height: '16px',
      fontSize: '10px',
      minWidth: '16px'
    },
    medium: {
      width: '20px',
      height: '20px',
      fontSize: '12px',
      minWidth: '20px'
    },
    large: {
      width: '24px',
      height: '24px',
      fontSize: '14px',
      minWidth: '24px'
    }
  }

  const badgeColor = color || Colors.error[500]
  const currentSize = sizeStyles[size]

  return (
    <div
      style={{
        position: 'absolute',
        top: '-5px',
        right: '-5px',
        backgroundColor: badgeColor,
        color: 'white',
        borderRadius: size === 'small' ? '8px' : size === 'large' ? '12px' : '10px',
        ...currentSize,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontWeight: '600',
        paddingLeft: count > 9 ? '2px' : '0',
        paddingRight: count > 9 ? '2px' : '0',
      }}
    >
      {count > 99 ? '99+' : count}
    </div>
  )
}
