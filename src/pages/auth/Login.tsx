import React, { useState, useEffect, useCallback, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '@/contexts/AuthContext'
import { useThemeMode } from '@/contexts/ThemeContext'
import { useLanguage } from '@/contexts/I18nContext'
import { getColors } from '@/constants/Colors'
import { ArrowLeft, Eye, EyeOff, Mail, Lock, LogIn, UserPlus, CheckCircle, XCircle } from 'lucide-react'
import './Auth.css'

export default function Login() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [hidePassword, setHidePassword] = useState(true)
  const [focusedField, setFocusedField] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const { signIn } = useAuth()
  const { colorScheme } = useThemeMode()
  const { t } = useLanguage()
  const Colors = getColors(colorScheme)
  const navigate = useNavigate()

  // Auto-dismiss error messages
  useEffect(() => {
    if (error) {
      const timer = setTimeout(() => {
        setError(null)
      }, 5000)
      return () => clearTimeout(timer)
    }
  }, [error])

  const isFormValid = useMemo(() => {
    return email.trim() !== '' && password.trim() !== ''
  }, [email, password])

  const handleLogin = useCallback(async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email || !password) {
      setError(t('error.pleaseFillAllFields'))
      return
    }

    setError(null)
    setLoading(true)

    try {
      await signIn(email, password)
      // Navigation is handled by signIn based on user role
    } catch (err: any) {
      setError(err.message || t('auth.loginFailed'))
    } finally {
      setLoading(false)
    }
  }, [email, password, signIn, navigate, t])

  const handleSignUp = useCallback(() => {
    setError(null)
    navigate('/auth/signup')
  }, [navigate])

  const handleForgotPassword = useCallback(() => {
    navigate('/auth/forgot-password')
  }, [navigate])

  const togglePasswordVisibility = useCallback(() => {
    setHidePassword(!hidePassword)
  }, [hidePassword])

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

          <div className="auth-logo-container">
            <div
              className="auth-logo"
              style={{
                backgroundColor: Colors.primary[600],
              }}
            >
              <div style={{ width: '40px', height: '40px', borderRadius: '8px', backgroundColor: Colors.white }} />
            </div>
            <h1 className="auth-welcome-title" style={{ color: Colors.neutral[900] }}>
              {t('auth.welcomeBack')}
            </h1>
            <p className="auth-welcome-subtitle" style={{ color: Colors.neutral[600] }}>
              {t('auth.signInToAccount')}
            </p>
          </div>
        </div>

        {/* Message Display */}
        {error && (
          <div
            className="auth-message-container auth-error-message"
            style={{
              backgroundColor: Colors.error[50],
              borderColor: Colors.error[200],
            }}
          >
            <XCircle size={20} color={Colors.error[600]} style={{ marginRight: '12px', flexShrink: 0 }} />
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

        {/* Form */}
        <div className="auth-form-container">
          {/* Email Input */}
          <div className="auth-input-group">
            <label className="auth-input-label" style={{ color: Colors.neutral[900] }}>
              {t('auth.emailAddress')}
            </label>
            <div
              className="auth-input-container"
              style={{
                borderColor: focusedField === 'email' ? Colors.primary[600] : Colors.neutral[200],
                backgroundColor: Colors.neutral[50],
              }}
            >
              <Mail
                size={20}
                color={focusedField === 'email' ? Colors.primary[600] : Colors.neutral[400]}
                className="auth-input-icon"
              />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                onFocus={() => setFocusedField('email')}
                onBlur={() => setFocusedField(null)}
                placeholder={t('auth.enterYourEmail')}
                className="auth-text-input"
                style={{
                  color: Colors.neutral[900],
                }}
                autoComplete="email"
                autoCapitalize="none"
              />
            </div>
          </div>

          {/* Password Input */}
          <div className="auth-input-group">
            <label className="auth-input-label" style={{ color: Colors.neutral[900] }}>
              {t('auth.password')}
            </label>
            <div
              className="auth-input-container"
              style={{
                borderColor: focusedField === 'password' ? Colors.primary[600] : Colors.neutral[200],
                backgroundColor: Colors.neutral[50],
              }}
            >
              <Lock
                size={20}
                color={focusedField === 'password' ? Colors.primary[600] : Colors.neutral[400]}
                className="auth-input-icon"
              />
              <input
                type={hidePassword ? 'password' : 'text'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                onFocus={() => setFocusedField('password')}
                onBlur={() => setFocusedField(null)}
                placeholder={t('auth.enterYourPassword')}
                className="auth-text-input"
                style={{
                  color: Colors.neutral[900],
                }}
                autoComplete="password"
              />
              <button
                type="button"
                onClick={togglePasswordVisibility}
                className="auth-eye-button"
              >
                {hidePassword ? (
                  <EyeOff size={20} color={Colors.neutral[400]} />
                ) : (
                  <Eye size={20} color={Colors.neutral[400]} />
                )}
              </button>
            </div>
          </div>

          {/* Forgot Password */}
          <div className="auth-forgot-password-container">
            <button
              type="button"
              onClick={handleForgotPassword}
              className="auth-forgot-password-text"
              style={{
                color: Colors.primary[600],
              }}
            >
              {t('auth.forgotPassword')}
            </button>
          </div>

          {/* Login Button */}
          <button
            type="button"
            onClick={handleLogin}
            disabled={!isFormValid || loading}
            className="auth-primary-button"
            style={{
              backgroundColor: (!isFormValid || loading) ? Colors.neutral[300] : Colors.primary[600],
              boxShadow: (!isFormValid || loading) ? 'none' : `0 4px 12px rgba(0, 0, 0, 0.15)`,
            }}
          >
            {loading ? (
              <span style={{ color: '#FFFFFF', fontWeight: '600' }}>
                {t('auth.signingIn')}
              </span>
            ) : (
              <>
                <LogIn size={20} color="#FFFFFF" style={{ marginRight: '8px' }} />
                <span style={{ color: '#FFFFFF', fontWeight: '600' }}>
                  {t('auth.signIn')}
                </span>
              </>
            )}
          </button>

          {/* Divider */}
          <div className="auth-divider">
            <div className="auth-divider-line" style={{ backgroundColor: Colors.neutral[200] }} />
            <span className="auth-divider-text" style={{ color: Colors.neutral[500] }}>
              {t('auth.or')}
            </span>
            <div className="auth-divider-line" style={{ backgroundColor: Colors.neutral[200] }} />
          </div>

          {/* Sign Up Section */}
          <div
            className="auth-signup-container"
            style={{
              backgroundColor: Colors.neutral[50],
            }}
          >
            <p className="auth-signup-text" style={{ color: Colors.neutral[700] }}>
              {t('auth.dontHaveAccountYet')}
            </p>
            <button
              type="button"
              onClick={handleSignUp}
              className="auth-signup-button"
              style={{
                backgroundColor: Colors.white,
                borderColor: Colors.primary[200],
              }}
            >
              <UserPlus size={16} color={Colors.primary[700]} />
              <span
                className="auth-signup-button-text"
                style={{
                  color: Colors.primary[700],
                }}
              >
                {t('auth.createAccount')}
              </span>
            </button>
          </div>
        </div>

        {/* Footer */}
        <div className="auth-footer">
          <p className="auth-footer-text" style={{ color: Colors.neutral[500] }}>
            {t('auth.bySigningIn')}{' '}
            <a
              href="/terms"
              className="auth-terms-link"
              style={{ color: Colors.primary[600] }}
            >
              {t('auth.termsOfService')}
            </a>
            {' '}{t('auth.and')}{' '}
            <a
              href="/privacy"
              className="auth-terms-link"
              style={{ color: Colors.primary[600] }}
            >
              {t('auth.privacyPolicy')}
            </a>
          </p>
        </div>
      </div>
    </div>
  )
}
