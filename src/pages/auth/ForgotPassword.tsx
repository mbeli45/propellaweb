import React, { useState, useEffect, useCallback, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '@/contexts/AuthContext'
import { useThemeMode } from '@/contexts/ThemeContext'
import { useLanguage } from '@/contexts/I18nContext'
import { getColors } from '@/constants/Colors'
import { ArrowLeft, Lock, Mail } from 'lucide-react'
import Loader from '@/components/ui/Loader'
import './Auth.css'

export default function ForgotPassword() {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const { forgotPassword } = useAuth()
  const { colorScheme } = useThemeMode()
  const { t } = useLanguage()
  const Colors = getColors(colorScheme)
  const navigate = useNavigate()

  const isValidEmail = useMemo(() => {
    return email && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
  }, [email])

  const isButtonDisabled = useMemo(() => {
    return loading || !isValidEmail
  }, [loading, isValidEmail])

  // Scroll to top on mount
  useEffect(() => {
    window.scrollTo(0, 0)
  }, [])

  // Auto-dismiss messages
  useEffect(() => {
    if (error) {
      const timer = setTimeout(() => {
        setError(null)
      }, 5000)
      return () => clearTimeout(timer)
    }
  }, [error])

  const handleSendReset = useCallback(async (e: React.FormEvent) => {
    e.preventDefault()
    if (loading || !isValidEmail) return

    setError(null)
    setLoading(true)

    try {
      await forgotPassword(email)
      // Navigate to verify screen after successful password reset request
      navigate(`/auth/verify?mode=reset&email=${encodeURIComponent(email)}`)
    } catch (err: any) {
      setError(err.message || t('forgotPassword.error'))
    } finally {
      setLoading(false)
    }
  }, [loading, email, isValidEmail, forgotPassword, navigate, t])


  return (
    <div className="auth-container" style={{ backgroundColor: Colors.white }}>
      <div className="auth-scroll-content">
        {/* Header */}
        <div className="auth-header">
          <button
            onClick={() => navigate(-1)}
            className="auth-back-button"
            style={{
              backgroundColor: Colors.neutral[100],
            }}
          >
            <ArrowLeft size={20} color={Colors.neutral[700]} />
          </button>
          <h2
            style={{
              fontSize: '18px',
              fontWeight: '600',
              color: Colors.neutral[900],
              textAlign: 'center',
              flex: 1,
              margin: 0,
            }}
          >
            {t('forgotPassword.forgotPassword')}
          </h2>
          <div style={{ width: '40px' }} />
        </div>

        <div className="auth-form-container">
          {/* Icon */}
          <div className="auth-icon-container" style={{ backgroundColor: Colors.primary[50] }}>
            <Lock size={48} color={Colors.primary[600]} />
          </div>

          {/* Title and Description */}
          <div className="auth-content-header">
            <h1 className="auth-content-title" style={{ color: Colors.neutral[900] }}>
              {t('forgotPassword.resetYourPassword')}
            </h1>
            <p className="auth-content-description" style={{ color: Colors.neutral[600] }}>
              {t('forgotPassword.resetDescription')}
            </p>
          </div>

          {/* Message */}
          {error && (
            <div
              className="auth-message-container auth-error-message"
              style={{
                backgroundColor: Colors.error[50],
                borderColor: Colors.error[200],
              }}
            >
              <p
                className="auth-message-text"
                style={{
                  color: Colors.error[700],
                }}
              >
                {error}
              </p>
            </div>
          )}

          {/* Email Input */}
          <form onSubmit={handleSendReset}>
            <div className="auth-input-group">
              <label className="auth-input-label" style={{ color: Colors.neutral[900] }}>
                {t('forgotPassword.emailAddress')}
              </label>
              <div
                className="auth-input-container"
                style={{
                  borderColor: Colors.neutral[200],
                  backgroundColor: Colors.neutral[50],
                }}
              >
                <Mail size={20} color={Colors.neutral[400]} className="auth-input-icon" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder={t('forgotPassword.enterYourEmail')}
                  className="auth-text-input"
                  style={{
                    color: Colors.neutral[900],
                  }}
                  autoCapitalize="none"
                  autoComplete="email"
                />
              </div>
            </div>

            {/* Help Text */}
            <div className="auth-help-section">
              <p className="auth-help-text" style={{ color: Colors.neutral[600] }}>
                {t('forgotPassword.helpText')}
              </p>
            </div>
          </form>
        </div>

        {/* Bottom Actions */}
        <div
          className="auth-bottom-actions"
          style={{
            backgroundColor: Colors.white,
            borderTopColor: Colors.neutral[100],
          }}
        >
          <button
            onClick={handleSendReset}
            disabled={isButtonDisabled}
            className="auth-primary-button"
            style={{
              backgroundColor: isButtonDisabled ? Colors.neutral[300] : Colors.primary[600],
              boxShadow: isButtonDisabled ? 'none' : `0 4px 12px rgba(0, 0, 0, 0.15)`,
            }}
          >
            {loading ? (
              <Loader size="small" variant="button" color="white" />
            ) : (
              <span style={{ color: Colors.white, fontWeight: '600' }}>
                {t('forgotPassword.sendResetCode')}
              </span>
            )}
          </button>

          {/* Alternative Action */}
          <div className="auth-alternative-section">
            <span className="auth-alternative-text" style={{ color: Colors.neutral[600] }}>
              {t('forgotPassword.rememberPassword')}
            </span>
            <button
              type="button"
              onClick={() => navigate('/auth/login')}
              className="auth-alternative-link"
              style={{
                color: Colors.primary[600],
              }}
            >
              {t('forgotPassword.signIn')}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
