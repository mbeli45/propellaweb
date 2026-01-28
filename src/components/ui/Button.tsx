import React from 'react'
import { useThemeMode } from '@/contexts/ThemeContext'
import { getColors } from '@/constants/Colors'
import Loader from './Loader'

interface ButtonProps {
  title: string
  onPress: () => void
  variant?: 'primary' | 'secondary' | 'outline'
  size?: 'small' | 'medium' | 'large'
  disabled?: boolean
  loading?: boolean
  style?: React.CSSProperties
  textStyle?: React.CSSProperties
}

export default function Button({
  title,
  onPress,
  variant = 'primary',
  size = 'medium',
  disabled = false,
  loading = false,
  style,
  textStyle,
}: ButtonProps) {
  const { colorScheme } = useThemeMode()
  const Colors = getColors(colorScheme)

  const getButtonStyle = (): React.CSSProperties => {
    const baseStyle: React.CSSProperties = {
      padding: size === 'small' ? '8px 16px' : size === 'large' ? '16px 32px' : '12px 24px',
      borderRadius: '8px',
      fontSize: size === 'small' ? '14px' : size === 'large' ? '18px' : '16px',
      fontWeight: '500',
      cursor: disabled || loading ? 'not-allowed' : 'pointer',
      transition: 'all 0.2s',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      gap: '8px',
      border: 'none',
      outline: 'none',
    }

    if (variant === 'primary') {
      baseStyle.backgroundColor = disabled || loading ? Colors.neutral[400] : Colors.primary[600]
      baseStyle.color = '#FFFFFF'
    } else if (variant === 'secondary') {
      baseStyle.backgroundColor = disabled || loading ? Colors.neutral[200] : Colors.neutral[100]
      baseStyle.color = Colors.neutral[900]
    } else if (variant === 'outline') {
      baseStyle.backgroundColor = 'transparent'
      baseStyle.border = `1px solid ${disabled || loading ? Colors.neutral[300] : Colors.primary[600]}`
      baseStyle.color = disabled || loading ? Colors.neutral[400] : Colors.primary[600]
    }

    if (disabled || loading) {
      baseStyle.opacity = 0.6
    }

    return { ...baseStyle, ...style }
  }

  const getTextStyle = (): React.CSSProperties => {
    return {
      margin: 0,
      ...textStyle,
    }
  }

  return (
    <button
      onClick={onPress}
      disabled={disabled || loading}
      style={getButtonStyle()}
      onMouseEnter={(e) => {
        if (!disabled && !loading) {
          if (variant === 'primary') {
            e.currentTarget.style.backgroundColor = Colors.primary[700]
          } else if (variant === 'secondary') {
            e.currentTarget.style.backgroundColor = Colors.neutral[200]
          } else if (variant === 'outline') {
            e.currentTarget.style.borderColor = Colors.primary[700]
            e.currentTarget.style.color = Colors.primary[700]
          }
        }
      }}
      onMouseLeave={(e) => {
        if (!disabled && !loading) {
          if (variant === 'primary') {
            e.currentTarget.style.backgroundColor = Colors.primary[600]
          } else if (variant === 'secondary') {
            e.currentTarget.style.backgroundColor = Colors.neutral[100]
          } else if (variant === 'outline') {
            e.currentTarget.style.borderColor = Colors.primary[600]
            e.currentTarget.style.color = Colors.primary[600]
          }
        }
      }}
    >
      {loading ? (
        <>
          <Loader variant="button" size="small" color={variant === 'outline' ? Colors.primary[600] : '#FFFFFF'} />
          <span style={getTextStyle()}>{title}</span>
        </>
      ) : (
        <span style={getTextStyle()}>{title}</span>
      )}
    </button>
  )
}
