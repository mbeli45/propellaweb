import React from 'react'
import { useThemeMode } from '@/contexts/ThemeContext'
import { getColors } from '@/constants/Colors'

interface LoaderProps {
  size?: 'small' | 'large'
  text?: string
  variant?: 'fullscreen' | 'inline' | 'button'
  color?: string
}

export default function Loader({
  size = 'large',
  text,
  variant = 'fullscreen',
  color,
}: LoaderProps) {
  const { colorScheme } = useThemeMode()
  const Colors = getColors(colorScheme)

  const loaderColor = color || Colors.primary[600]
  const textColor = variant === 'button' ? Colors.white : Colors.neutral[600]

  const containerStyle: React.CSSProperties = {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
  }

  if (variant === 'fullscreen') {
    containerStyle.position = 'fixed'
    containerStyle.top = '0'
    containerStyle.left = '0'
    containerStyle.right = '0'
    containerStyle.bottom = '0'
    containerStyle.backgroundColor = Colors.neutral[50]
    containerStyle.zIndex = 9999
  } else if (variant === 'inline') {
    containerStyle.padding = '24px'
  } else if (variant === 'button') {
    containerStyle.padding = '0'
  }

  const spinnerSize = size === 'small' ? '20px' : '40px'
  const spinnerBorder = size === 'small' ? '2px' : '4px'

  return (
    <div style={containerStyle}>
      <div
        style={{
          width: spinnerSize,
          height: spinnerSize,
          border: `${spinnerBorder} solid ${Colors.neutral[200]}`,
          borderTop: `${spinnerBorder} solid ${loaderColor}`,
          borderRadius: '50%',
          animation: 'spin 1s linear infinite',
        }}
      />
      {text && (
        <p
          style={{
            marginTop: variant === 'button' ? '0' : '16px',
            fontSize: variant === 'button' ? '14px' : '16px',
            color: textColor,
            textAlign: 'center',
            margin: variant === 'button' ? '0' : undefined,
          }}
        >
          {text}
        </p>
      )}
      <style>
        {`
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
        `}
      </style>
    </div>
  )
}
