import React, { useState, useEffect, useCallback, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '@/contexts/AuthContext'
import { useThemeMode } from '@/contexts/ThemeContext'
import { useLanguage } from '@/contexts/I18nContext'
import { getColors } from '@/constants/Colors'
import { ArrowLeft, Eye, EyeOff, Mail, Lock, LogIn, UserPlus, CheckCircle, XCircle } from 'lucide-react'
import { Input } from '@/components/ui/Input'
import { IconButton } from '@mui/material'
import { Icon } from '@iconify/react'
import { signInWithGoogle } from '@/lib/googleAuth'
import './Auth.css'

export default function Login() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [hidePassword, setHidePassword] = useState(true)
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

  const handleGoogleSignIn = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      const { error: googleError } = await signInWithGoogle()
      
      if (googleError) {
        setError(googleError)
      }
      // Browser will redirect to Google OAuth page
    } catch (err: any) {
      setError(err.message || 'Google Sign-In failed')
      setLoading(false)
    }
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

          <div className="auth-logo-container">
            <div
              className="auth-logo"
              style={{
                backgroundColor: Colors.primary[600],
              }}
            >
              <img 
                src="/app-icon.png" 
                alt="Propella" 
                style={{ width: '40px', height: '40px', borderRadius: '8px' }}
              />
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
          <Input
            label={t('auth.emailAddress')}
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            icon={Mail}
            autoComplete="email"
            disabled={loading}
          />

          {/* Password Input */}
          <Input
            label={t('auth.password')}
            type={hidePassword ? 'password' : 'text'}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            icon={Lock}
            autoComplete="password"
            disabled={loading}
            rightIcon={
              <IconButton
                onClick={togglePasswordVisibility}
                edge="end"
                disabled={loading}
                sx={{ 
                  color: Colors.neutral[400],
                  '&:hover': {
                    color: Colors.primary[600],
                    backgroundColor: Colors.primary[50],
                  },
                }}
              >
                <Icon 
                  icon={hidePassword ? "lucide:eye-off" : "lucide:eye"} 
                  width={20} 
                />
              </IconButton>
            }
          />

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

          {/* Google Sign-In Button */}
          <button
            type="button"
            onClick={handleGoogleSignIn}
            disabled={loading}
            className="auth-google-button"
            style={{
              backgroundColor: Colors.white,
              borderColor: Colors.neutral[200],
            }}
          >
            <img 
              src="https://www.google.com/favicon.ico" 
              alt="Google"
              style={{ width: '20px', height: '20px', marginRight: '12px' }}
            />
            <span style={{ color: Colors.neutral[700], fontWeight: '600' }}>
              {t('auth.continueWithGoogle')}
            </span>
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
