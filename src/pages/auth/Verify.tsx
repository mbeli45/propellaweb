import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { useAuth } from '@/contexts/AuthContext'
import { useThemeMode } from '@/contexts/ThemeContext'
import { useLanguage } from '@/contexts/I18nContext'
import { getColors } from '@/constants/Colors'
import { ArrowLeft, Mail, Shield } from 'lucide-react'
import './Auth.css'

export default function Verify() {
  const [code, setCode] = useState(['', '', '', '', '', ''])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [resendTimeLeft, setResendTimeLeft] = useState(300)
  const [email, setEmail] = useState('')
  const { verifyOTP, resendVerificationCode } = useAuth()
  const { colorScheme } = useThemeMode()
  const { t } = useLanguage()
  const Colors = getColors(colorScheme)
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const inputRefs = useRef<(HTMLInputElement | null)[]>([])

  const isResetMode = useMemo(() => {
    return searchParams.get('mode') === 'reset'
  }, [searchParams])

  const isCodeComplete = useMemo(() => {
    return code.join('').length === 6
  }, [code])

  const isButtonDisabled = useMemo(() => {
    return loading || !isCodeComplete
  }, [loading, isCodeComplete])

  // Scroll to top on mount
  useEffect(() => {
    window.scrollTo(0, 0)
  }, [])

  useEffect(() => {
    // Prioritize email from query string, then localStorage
    const urlEmail = searchParams.get('email')
    const savedEmail = localStorage.getItem('pendingVerificationEmail')
    const resetEmail = localStorage.getItem('pendingPasswordResetEmail')
    setEmail(urlEmail || savedEmail || resetEmail || '')
  }, [searchParams])

  useEffect(() => {
    if (resendTimeLeft > 0) {
      const timer = setTimeout(() => setResendTimeLeft(resendTimeLeft - 1), 1000)
      return () => clearTimeout(timer)
    }
  }, [resendTimeLeft])

  const handleCodeChange = useCallback((value: string, index: number) => {
    if (!/^\d*$/.test(value)) return

    setCode(prevCode => {
      const newCode = [...prevCode]
      newCode[index] = value.slice(-1)

      // Auto-focus next input
      if (value && index < 5) {
        setTimeout(() => inputRefs.current[index + 1]?.focus(), 0)
      }

      return newCode
    })
  }, [])

  const handleKeyDown = useCallback((e: React.KeyboardEvent, index: number) => {
    if (e.key === 'Backspace' && !code[index] && index > 0) {
      inputRefs.current[index - 1]?.focus()
    }
  }, [code])

  const handlePaste = useCallback((e: React.ClipboardEvent) => {
    e.preventDefault()
    const pastedCode = e.clipboardData.getData('text').slice(0, 6)
    if (/^\d+$/.test(pastedCode)) {
      const newCode = pastedCode.split('').concat(Array(6 - pastedCode.length).fill(''))
      setCode(newCode)
      inputRefs.current[Math.min(pastedCode.length, 5)]?.focus()
    }
  }, [])

  const handleVerify = useCallback(async (e: React.FormEvent) => {
    e.preventDefault()
    const fullCode = code.join('')
    if (fullCode.length !== 6) {
      setError(t('verify.pleaseEnterCompleteCode'))
      return
    }

    setError(null)
    setLoading(true)

    try {
      await verifyOTP(fullCode, isResetMode ? 'reset' : undefined, email)
      // Navigation is handled by useAuth hook based on mode
      // For reset mode: navigates to /auth/reset-password
      // For signup mode: navigates to /user or /agent
    } catch (err: any) {
      setError(err.message || t('verify.verificationFailed'))
    } finally {
      setLoading(false)
    }
  }, [code, isResetMode, email, verifyOTP, t])

  const handleResend = useCallback(async () => {
    if (resendTimeLeft > 0) return

    setError(null)
    try {
      await resendVerificationCode(email, isResetMode ? 'reset' : 'verify')
      setResendTimeLeft(300)
    } catch (err: any) {
      setError(err.message || t('verify.resendFailed'))
    }
  }, [resendTimeLeft, email, isResetMode, resendVerificationCode, t])

  const dismissMessage = useCallback(() => {
    setError(null)
  }, [])

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
            {isResetMode ? t('verify.resetPassword') : t('verify.verifyEmail')}
          </h2>
          <div style={{ width: '40px' }} />
        </div>

        <div className="auth-form-container">
          {/* Icon */}
          <div className="auth-icon-container" style={{ backgroundColor: Colors.primary[50] }}>
            {isResetMode ? (
              <Shield size={48} color={Colors.primary[600]} />
            ) : (
              <Mail size={48} color={Colors.primary[600]} />
            )}
          </div>

          {/* Title and Description */}
          <div className="auth-content-header">
            <h1 className="auth-content-title" style={{ color: Colors.neutral[900] }}>
              {isResetMode ? t('verify.enterResetCode') : t('verify.checkYourEmail')}
            </h1>
            <p className="auth-content-description" style={{ color: Colors.neutral[600] }}>
              {isResetMode
                ? t('verify.resetCodeDescription')
                : t('verify.verificationCodeDescription')
              }
            </p>
          </div>

          {/* Message */}
          {error && (
            <div
              className="auth-message-container auth-error-message"
              style={{
                backgroundColor: Colors.error[50],
                borderColor: Colors.error[200],
                position: 'relative',
              }}
            >
              <p
                className="auth-message-text"
                style={{
                  color: Colors.error[700],
                  paddingRight: '24px',
                }}
              >
                {error}
              </p>
              <button
                onClick={dismissMessage}
                style={{
                  position: 'absolute',
                  right: '12px',
                  top: '12px',
                  background: 'none',
                  border: 'none',
                  fontSize: '18px',
                  fontWeight: '600',
                  color: Colors.neutral[500],
                  cursor: 'pointer',
                  padding: '4px',
                }}
              >
                ×
              </button>
            </div>
          )}

          {/* Code Input */}
          <form onSubmit={handleVerify}>
            <div className="auth-code-section">
              <label className="auth-code-label" style={{ color: Colors.neutral[900] }}>
                {t('verify.verificationCode')}
              </label>
              <div className="auth-code-container">
                {code.map((digit, index) => (
                  <input
                    key={index}
                    ref={(el) => { inputRefs.current[index] = el }}
                    type="text"
                    inputMode="numeric"
                    maxLength={1}
                    value={digit}
                    onChange={(e) => handleCodeChange(e.target.value, index)}
                    onKeyDown={(e) => handleKeyDown(e, index)}
                    onPaste={index === 0 ? handlePaste : undefined}
                    className="auth-code-input"
                    style={{
                      borderColor: digit ? Colors.primary[500] : Colors.neutral[200],
                      backgroundColor: digit ? Colors.primary[50] : Colors.neutral[50],
                      color: Colors.neutral[900],
                    }}
                  />
                ))}
              </div>
            </div>

            {/* Resend Code */}
            <div className="auth-resend-section">
              <p className="auth-resend-prompt" style={{ color: Colors.neutral[600] }}>
                {t('verify.didntReceiveCode')}
              </p>
              <button
                type="button"
                onClick={handleResend}
                disabled={resendTimeLeft > 0}
                className="auth-resend-button"
                style={{
                  cursor: resendTimeLeft > 0 ? 'not-allowed' : 'pointer',
                }}
              >
                <span
                  className="auth-resend-text"
                  style={{
                    color: resendTimeLeft > 0 ? Colors.neutral[400] : Colors.primary[600],
                  }}
                >
                  {resendTimeLeft > 0
                    ? t('verify.resendInSeconds', { seconds: resendTimeLeft })
                    : t('verify.resendCode')
                  }
                </span>
              </button>
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
            onClick={handleVerify}
            disabled={isButtonDisabled}
            className="auth-primary-button"
            style={{
              backgroundColor: isButtonDisabled ? Colors.neutral[300] : Colors.primary[600],
              boxShadow: isButtonDisabled ? 'none' : `0 4px 12px rgba(0, 0, 0, 0.15)`,
            }}
          >
            {loading ? (
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <div
                  style={{
                    width: '16px',
                    height: '16px',
                    border: '2px solid rgba(255,255,255,0.3)',
                    borderTopColor: 'white',
                    borderRadius: '50%',
                    animation: 'spin 0.6s linear infinite',
                  }}
                />
                <span style={{ color: Colors.white, fontWeight: '600' }}>
                  {t('common.loading')}
                </span>
              </div>
            ) : (
              <span style={{ color: Colors.white, fontWeight: '600' }}>
                {isResetMode ? t('verify.verifyAndContinue') : t('verify.verifyEmailButton')}
              </span>
            )}
          </button>
        </div>
      </div>
    </div>
  )
}
