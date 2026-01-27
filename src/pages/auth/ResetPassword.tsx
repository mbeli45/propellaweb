import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { useAuth } from '@/contexts/AuthContext'
import { useThemeMode } from '@/contexts/ThemeContext'
import { useLanguage } from '@/contexts/I18nContext'
import { getColors } from '@/constants/Colors'
import { ArrowLeft, Lock, Eye, EyeOff, CheckCircle } from 'lucide-react'
import Button from '@/components/ui/Button'
import './Auth.css'

export default function ResetPassword() {
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [debouncedPassword, setDebouncedPassword] = useState('')
  const { resetPassword } = useAuth()
  const { colorScheme } = useThemeMode()
  const { t } = useLanguage()
  const Colors = getColors(colorScheme)
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const debounceTimeoutRef = useRef<NodeJS.Timeout | null>(null)

  // Debounce password for strength calculation
  useEffect(() => {
    if (!password) {
      setDebouncedPassword('')
      return
    }

    if (debounceTimeoutRef.current) {
      clearTimeout(debounceTimeoutRef.current)
    }

    debounceTimeoutRef.current = setTimeout(() => {
      setDebouncedPassword(password)
    }, 300)

    return () => {
      if (debounceTimeoutRef.current) {
        clearTimeout(debounceTimeoutRef.current)
      }
    }
  }, [password])

  // Scroll to top on mount
  useEffect(() => {
    window.scrollTo(0, 0)
  }, [])

  // Auto-dismiss error messages
  useEffect(() => {
    if (error) {
      const timer = setTimeout(() => {
        setError(null)
      }, 5000)
      return () => clearTimeout(timer)
    }
  }, [error])

  const calculatePasswordStrength = useMemo(() => (pwd: string, colors: any) => {
    if (!pwd) return { label: '', color: 'transparent', score: 0, requirements: [] }
    
    let score = 0
    const requirements = [
      { test: pwd.length >= 8, label: 'At least 8 characters' },
      { test: /[A-Z]/.test(pwd), label: 'One uppercase letter' },
      { test: /[a-z]/.test(pwd), label: 'One lowercase letter' },
      { test: /[0-9]/.test(pwd), label: 'One number' },
      { test: /[^A-Za-z0-9]/.test(pwd), label: 'One special character' },
    ]

    requirements.forEach(req => {
      if (req.test) score++
    })

    if (score <= 2) return { label: 'Weak', color: colors.error[500], score, requirements }
    if (score === 3 || score === 4) return { label: 'Medium', color: colors.warning[500], score, requirements }
    return { label: 'Strong', color: colors.success[500], score, requirements }
  }, [])

  const passwordStrength = useMemo(() => {
    return calculatePasswordStrength(debouncedPassword, Colors)
  }, [debouncedPassword, Colors, calculatePasswordStrength])

  const passwordsMatch = useMemo(() => {
    return password === confirmPassword && confirmPassword.length > 0
  }, [password, confirmPassword])

  const isFormValid = useMemo(() => {
    return password && 
           confirmPassword && 
           passwordsMatch && 
           password.length >= 8
  }, [password, confirmPassword, passwordsMatch])

  const handleReset = useCallback(async (e: React.FormEvent) => {
    e.preventDefault()
    if (loading || !isFormValid) return

    setError(null)
    setLoading(true)

    try {
      const token = searchParams.get('token') || searchParams.get('access_token')
      await resetPassword(password, token || '')
      alert(t('resetPassword.passwordResetSuccess'))
      navigate('/auth/login')
    } catch (err: any) {
      setError(err.message || t('resetPassword.resetFailed'))
    } finally {
      setLoading(false)
    }
  }, [loading, password, confirmPassword, isFormValid, resetPassword, searchParams, navigate, t])

  const togglePasswordVisibility = useCallback(() => {
    setShowPassword(prev => !prev)
  }, [])

  const toggleConfirmPasswordVisibility = useCallback(() => {
    setShowConfirmPassword(prev => !prev)
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
            {t('resetPassword.resetPassword')}
          </h2>
          <div style={{ width: '40px' }} />
        </div>

        <form className="auth-form-container" onSubmit={handleReset}>
          {/* Icon */}
          <div className="auth-icon-container" style={{ backgroundColor: Colors.primary[50] }}>
            <Lock size={48} color={Colors.primary[600]} />
          </div>

          {/* Title and Description */}
          <div className="auth-content-header">
            <h1 className="auth-content-title" style={{ color: Colors.neutral[900] }}>
              {t('resetPassword.createNewPassword')}
            </h1>
            <p className="auth-content-description" style={{ color: Colors.neutral[600] }}>
              {t('resetPassword.createNewPasswordDescription')}
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
                onClick={() => setError(null)}
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

          {/* New Password Input */}
          <div className="auth-input-group">
            <label className="auth-input-label" style={{ color: Colors.neutral[900] }}>
              {t('resetPassword.newPassword')}
            </label>
            <div
              className="auth-input-container"
              style={{
                borderColor: Colors.neutral[200],
                backgroundColor: Colors.neutral[50],
              }}
            >
              <Lock size={20} color={Colors.neutral[400]} className="auth-input-icon" />
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder={t('resetPassword.enterNewPassword')}
                className="auth-text-input"
                style={{
                  color: Colors.neutral[900],
                }}
                autoComplete="new-password"
              />
              <button
                type="button"
                onClick={togglePasswordVisibility}
                className="auth-eye-button"
              >
                {showPassword ? (
                  <EyeOff size={20} color={Colors.neutral[400]} />
                ) : (
                  <Eye size={20} color={Colors.neutral[400]} />
                )}
              </button>
            </div>

            {/* Password Strength Indicator */}
            {password.length > 0 && (
              <div
                className="auth-password-strength-container"
                style={{
                  marginTop: '16px',
                  padding: '16px',
                  backgroundColor: Colors.neutral[50],
                  borderRadius: '12px',
                  border: `1px solid ${Colors.neutral[100]}`,
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                  <span className="auth-password-strength-text" style={{ color: Colors.neutral[700] }}>
                    {t('resetPassword.passwordStrength')}
                  </span>
                  <span
                    className="auth-password-strength-text"
                    style={{
                      color: passwordStrength.color,
                      fontWeight: '600',
                    }}
                  >
                    {passwordStrength.label}
                  </span>
                </div>
                <div
                  style={{
                    height: '6px',
                    backgroundColor: Colors.neutral[200],
                    borderRadius: '3px',
                    marginBottom: '16px',
                    overflow: 'hidden',
                  }}
                >
                  <div
                    style={{
                      width: `${passwordStrength.score * 20}%`,
                      height: '100%',
                      backgroundColor: passwordStrength.color,
                      borderRadius: '3px',
                      transition: 'width 0.3s',
                    }}
                  />
                </div>
                <div className="auth-password-requirements">
                  {passwordStrength.requirements.map((req, index) => (
                    <div key={index} className="auth-requirement-item">
                      <CheckCircle
                        size={16}
                        color={req.test ? Colors.success[600] : Colors.neutral[400]}
                      />
                      <span
                        className="auth-requirement-text"
                        style={{
                          color: req.test ? Colors.success[600] : Colors.neutral[600],
                        }}
                      >
                        {req.label}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Confirm Password Input */}
          <div className="auth-input-group">
            <label className="auth-input-label" style={{ color: Colors.neutral[900] }}>
              {t('resetPassword.confirmPassword')}
            </label>
            <div
              className="auth-input-container"
              style={{
                borderColor: confirmPassword && !passwordsMatch ? Colors.error[300] : Colors.neutral[200],
                backgroundColor: Colors.neutral[50],
              }}
            >
              <Lock size={20} color={Colors.neutral[400]} className="auth-input-icon" />
              <input
                type={showConfirmPassword ? 'text' : 'password'}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder={t('resetPassword.confirmNewPassword')}
                className="auth-text-input"
                style={{
                  color: Colors.neutral[900],
                }}
                autoComplete="new-password"
              />
              <button
                type="button"
                onClick={toggleConfirmPasswordVisibility}
                className="auth-eye-button"
              >
                {showConfirmPassword ? (
                  <EyeOff size={20} color={Colors.neutral[400]} />
                ) : (
                  <Eye size={20} color={Colors.neutral[400]} />
                )}
              </button>
            </div>
            {confirmPassword && !passwordsMatch && (
              <p className="auth-error-hint" style={{ color: Colors.error[600] }}>
                {t('resetPassword.passwordsDoNotMatch')}
              </p>
            )}
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
        <Button
          title={t('resetPassword.resetPasswordButton')}
          onPress={handleReset}
          disabled={loading || !isFormValid}
          loading={loading}
          variant="primary"
        />
      </div>
    </div>
  )
}
