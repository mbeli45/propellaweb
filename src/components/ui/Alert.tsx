import React from 'react'
import { useThemeMode } from '@/contexts/ThemeContext'
import { getColors } from '@/constants/Colors'
import { CheckCircle, XCircle, AlertCircle, Info, X } from 'lucide-react'

type AlertType = 'success' | 'error' | 'warning' | 'info'

interface AlertProps {
  open: boolean
  title?: string
  message: string
  type?: AlertType
  onClose: () => void
}

export default function Alert({
  open,
  title,
  message,
  type = 'info',
  onClose,
}: AlertProps) {
  const { colorScheme } = useThemeMode()
  const Colors = getColors(colorScheme)

  if (!open) return null

  const typeConfig = {
    success: {
      icon: CheckCircle,
      iconColor: Colors.success[600],
      bgColor: Colors.success[50],
      borderColor: Colors.success[200],
      textColor: Colors.success[700],
    },
    error: {
      icon: XCircle,
      iconColor: Colors.error[600],
      bgColor: Colors.error[50],
      borderColor: Colors.error[200],
      textColor: Colors.error[700],
    },
    warning: {
      icon: AlertCircle,
      iconColor: Colors.warning[600],
      bgColor: Colors.warning[50],
      borderColor: Colors.warning[200],
      textColor: Colors.warning[700],
    },
    info: {
      icon: Info,
      iconColor: Colors.primary[600],
      bgColor: Colors.primary[50],
      borderColor: Colors.primary[200],
      textColor: Colors.primary[700],
    },
  }

  const config = typeConfig[type]
  const Icon = config.icon

  return (
    <div
      style={{
        position: 'fixed',
        top: '20px',
        right: '20px',
        backgroundColor: config.bgColor,
        border: `1px solid ${config.borderColor}`,
        borderRadius: '12px',
        padding: '16px 20px',
        display: 'flex',
        alignItems: 'center',
        gap: '12px',
        maxWidth: '400px',
        boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
        zIndex: 10001,
        animation: 'slideIn 0.3s ease-out',
      }}
    >
      <Icon size={20} color={config.iconColor} style={{ flexShrink: 0 }} />
      <div style={{ flex: 1 }}>
        {title && (
          <h4
            style={{
              fontSize: '14px',
              fontWeight: '600',
              color: config.textColor,
              margin: '0 0 4px 0',
            }}
          >
            {title}
          </h4>
        )}
        <p
          style={{
            fontSize: '14px',
            color: config.textColor,
            margin: 0,
          }}
        >
          {message}
        </p>
      </div>
      <button
        onClick={onClose}
        style={{
          background: 'none',
          border: 'none',
          cursor: 'pointer',
          padding: '4px',
          display: 'flex',
          alignItems: 'center',
          color: config.textColor,
          opacity: 0.7,
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.opacity = '1'
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.opacity = '0.7'
        }}
      >
        <X size={18} />
      </button>
    </div>
  )
}
