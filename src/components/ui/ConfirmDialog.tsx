import React from 'react'
import { AlertTriangle, X } from 'lucide-react'
import { useThemeMode } from '@/contexts/ThemeContext'
import { useLanguage } from '@/contexts/I18nContext'
import { getColors } from '@/constants/Colors'

interface ConfirmDialogProps {
  open: boolean
  title: string
  message: string
  confirmText?: string
  cancelText?: string
  variant?: 'danger' | 'warning' | 'info'
  onConfirm: () => void
  onCancel: () => void
}

export default function ConfirmDialog({
  open,
  title,
  message,
  confirmText,
  cancelText,
  variant = 'warning',
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  const { colorScheme } = useThemeMode()
  const { t } = useLanguage()
  const Colors = getColors(colorScheme)

  if (!open) return null

  const variantColors = {
    danger: {
      icon: Colors.error[600],
      button: Colors.error[600],
      buttonHover: Colors.error[700],
    },
    warning: {
      icon: Colors.warning[600],
      button: Colors.warning[600],
      buttonHover: Colors.warning[700],
    },
    info: {
      icon: Colors.primary[600],
      button: Colors.primary[600],
      buttonHover: Colors.primary[700],
    },
  }

  const colors = variantColors[variant]

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 10000,
        padding: '20px',
      }}
      onClick={onCancel}
    >
      <div
        style={{
          backgroundColor: Colors.white,
          borderRadius: '16px',
          padding: '24px',
          maxWidth: '400px',
          width: '100%',
          boxShadow: '0 10px 40px rgba(0, 0, 0, 0.2)',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div style={{ marginBottom: '24px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
            <AlertTriangle size={24} color={colors.icon} />
            <h3
              style={{
                fontSize: '18px',
                fontWeight: '600',
                color: Colors.neutral[900],
                margin: 0,
              }}
            >
              {title}
            </h3>
          </div>
          <p
            style={{
              fontSize: '16px',
              color: Colors.neutral[600],
              margin: 0,
              lineHeight: '24px',
            }}
          >
            {message}
          </p>
        </div>

        <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
          <button
            onClick={onCancel}
            style={{
              padding: '12px 24px',
              borderRadius: '8px',
              border: 'none',
              backgroundColor: Colors.neutral[200],
              color: Colors.neutral[800],
              fontSize: '16px',
              fontWeight: '500',
              cursor: 'pointer',
              transition: 'all 0.2s',
              fontFamily: 'Inter, sans-serif',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = Colors.neutral[300]
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = Colors.neutral[200]
            }}
          >
            {cancelText || t('common.cancel') || 'Cancel'}
          </button>
          <button
            onClick={onConfirm}
            style={{
              padding: '12px 24px',
              borderRadius: '8px',
              border: 'none',
              backgroundColor: colors.button,
              color: '#FFFFFF',
              fontSize: '16px',
              fontWeight: '500',
              cursor: 'pointer',
              transition: 'all 0.2s',
              fontFamily: 'Inter, sans-serif',
              minWidth: '100px',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = colors.buttonHover
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = colors.button
            }}
          >
            {confirmText || t('common.confirm') || 'Confirm'}
          </button>
        </div>
      </div>
    </div>
  )
}
