import React, { useState, useEffect, useCallback, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '@/contexts/AuthContext'
import { useThemeMode } from '@/contexts/ThemeContext'
import { useLanguage } from '@/contexts/I18nContext'
import { getColors } from '@/constants/Colors'
import { ArrowLeft, Eye, EyeOff, CheckCircle, XCircle, User, Mail, Lock } from 'lucide-react'
import { Input } from '@/components/ui/Input'
import { IconButton } from '@mui/material'
import { Icon } from '@iconify/react'
import { signInWithGoogle } from '@/lib/googleAuth'
import { signInWithApple } from '@/lib/appleAuth'
import './Auth.css'

type UserType = 'normal' | 'agent' | 'landlord'

export default function Signup() {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [hidePassword, setHidePassword] = useState(true)
  const [userType, setUserType] = useState<UserType>('normal')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [eulaAccepted, setEulaAccepted] = useState(false)
  const { signUp } = useAuth()
  const { colorScheme } = useThemeMode()
  const { t } = useLanguage()
  const Colors = getColors(colorScheme)
  const navigate = useNavigate()

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

  const getPasswordStrength = useMemo(() => (password: string, colors: any) => {
    if (!password) return { label: '', color: 'transparent', score: 0, requirements: [] }
    
    let score = 0
    const requirements = [
      { test: password.length >= 8, label: t('signup.atLeast8Characters') },
      { test: /[A-Z]/.test(password), label: t('signup.atLeastOneUppercase') },
      { test: /[a-z]/.test(password), label: t('signup.atLeastOneLowercase') },
      { test: /[0-9]/.test(password), label: t('signup.atLeastOneNumber') },
      { test: /[^A-Za-z0-9]/.test(password), label: t('signup.atLeastOneSpecial') },
    ]

    requirements.forEach(req => {
      if (req.test) score++
    })

    if (score <= 2) return { label: 'Weak', color: Colors.error[500], score, requirements }
    if (score === 3 || score === 4) return { label: 'Medium', color: Colors.warning[500], score, requirements }
    return { label: 'Strong', color: Colors.success[500], score, requirements }
  }, [Colors, t])

  const passwordStrength = useMemo(() => {
    return getPasswordStrength(password, Colors)
  }, [password, Colors, getPasswordStrength])

  const isFormValid = useMemo(() => {
    return name.trim() !== '' &&
           email.trim() !== '' &&
           password.trim() !== '' &&
           passwordStrength.score >= 3 &&
           eulaAccepted
  }, [name, email, password, passwordStrength.score, eulaAccepted])

  const handleSignUp = useCallback(async (e: React.FormEvent) => {
    e.preventDefault()
    if (!name || !email || !password) {
      setError(t('error.pleaseFillAllFields'))
      return
    }

    const strength = getPasswordStrength(password, Colors)
    if (strength.score < 3) {
      setError(t('error.weakPassword'))
      return
    }

    if (!eulaAccepted) {
      setError(t('eula.mustAccept'))
      return
    }

    setError(null)
    setLoading(true)

    try {
      await signUp(email, password, name, userType, true)
      navigate(`/auth/verify?email=${encodeURIComponent(email)}`)
    } catch (err: any) {
      setError(err.message || t('auth.signupSuccess'))
    } finally {
      setLoading(false)
    }
  }, [email, password, name, userType, signUp, navigate, getPasswordStrength, Colors, t])

  const handleLogin = useCallback(() => {
    setError(null)
    navigate('/auth/login')
  }, [navigate])

  const handleGoogleSignIn = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      const { error: googleError } = await signInWithGoogle({ role: userType })
      
      if (googleError) {
        setError(googleError)
      }
      // Browser will redirect to Google OAuth page
    } catch (err: any) {
      setError(err.message || 'Google Sign-In failed')
      setLoading(false)
    }
  }, [userType])

  const handleAppleSignIn = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      const { error: appleError } = await signInWithApple({ role: userType })
      
      if (appleError) {
        setError(appleError)
        setLoading(false)
      }
      // Browser will redirect to Apple OAuth page
    } catch (err: any) {
      setError(err.message || 'Apple Sign-In failed')
      setLoading(false)
    }
  }, [userType])

  const getUserTypeIcon = useCallback((type: UserType, selected: boolean) => {
    const color = selected ? Colors.primary[600] : Colors.neutral[400]
    return <CheckCircle size={24} color={color} />
  }, [Colors])

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
              <img 
                src="/app-icon.png" 
                alt="Propella" 
                style={{ width: '40px', height: '40px', borderRadius: '8px' }}
              />
            </div>
            <h1 className="auth-welcome-title" style={{ color: Colors.neutral[900] }}>
              {t('signup.createAccount')}
            </h1>
            <p className="auth-welcome-subtitle" style={{ color: Colors.neutral[600] }}>
              {t('signup.joinPropella')}
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
        <form className="auth-form-container" onSubmit={handleSignUp}>
          {/* User Type Selection */}
          <div className="auth-user-type-container">
            <h2 className="auth-section-title" style={{ color: Colors.neutral[900] }}>
              {t('signup.iAmA')}
            </h2>
            <div className="auth-user-type-grid">
              <button
                type="button"
                onClick={() => setUserType('normal')}
                className="auth-user-type-card"
                style={{
                  backgroundColor: userType === 'normal' ? Colors.primary[50] : Colors.neutral[50],
                  borderColor: userType === 'normal' ? Colors.primary[500] : Colors.neutral[200],
                  boxShadow: userType === 'normal' ? `0 2px 8px rgba(0, 0, 0, 0.15)` : 'none',
                }}
              >
                <div className="auth-user-type-icon">
                  {getUserTypeIcon('normal', userType === 'normal')}
                </div>
                <span
                  className="auth-user-type-title"
                  style={{
                    color: userType === 'normal' ? Colors.primary[700] : Colors.neutral[700],
                  }}
                >
                  {t('signup.tenant')}
                </span>
                <span
                  className="auth-user-type-description"
                  style={{
                    color: userType === 'normal' ? Colors.primary[600] : Colors.neutral[500],
                  }}
                >
                  {t('signup.lookingForProperties')}
                </span>
              </button>

              <button
                type="button"
                onClick={() => setUserType('agent')}
                className="auth-user-type-card"
                style={{
                  backgroundColor: userType === 'agent' ? Colors.primary[50] : Colors.neutral[50],
                  borderColor: userType === 'agent' ? Colors.primary[500] : Colors.neutral[200],
                  boxShadow: userType === 'agent' ? `0 2px 8px rgba(0, 0, 0, 0.15)` : 'none',
                }}
              >
                <div className="auth-user-type-icon">
                  {getUserTypeIcon('agent', userType === 'agent')}
                </div>
                <span
                  className="auth-user-type-title"
                  style={{
                    color: userType === 'agent' ? Colors.primary[700] : Colors.neutral[700],
                  }}
                >
                  {t('signup.agent')}
                </span>
                <span
                  className="auth-user-type-description"
                  style={{
                    color: userType === 'agent' ? Colors.primary[600] : Colors.neutral[500],
                  }}
                >
                  {t('signup.realEstateProfessional')}
                </span>
              </button>

              <button
                type="button"
                onClick={() => setUserType('landlord')}
                className="auth-user-type-card"
                style={{
                  backgroundColor: userType === 'landlord' ? Colors.primary[50] : Colors.neutral[50],
                  borderColor: userType === 'landlord' ? Colors.primary[500] : Colors.neutral[200],
                  boxShadow: userType === 'landlord' ? `0 2px 8px rgba(0, 0, 0, 0.15)` : 'none',
                }}
              >
                <div className="auth-user-type-icon">
                  {getUserTypeIcon('landlord', userType === 'landlord')}
                </div>
                <span
                  className="auth-user-type-title"
                  style={{
                    color: userType === 'landlord' ? Colors.primary[700] : Colors.neutral[700],
                  }}
                >
                  {t('signup.landlord')}
                </span>
                <span
                  className="auth-user-type-description"
                  style={{
                    color: userType === 'landlord' ? Colors.primary[600] : Colors.neutral[500],
                  }}
                >
                  {t('signup.propertyOwner')}
                </span>
              </button>
            </div>
          </div>

          {/* Full Name Input */}
          <Input
            label={t('signup.fullName')}
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            icon={User}
            autoComplete="name"
            disabled={loading}
          />

          {/* Email Input */}
          <Input
            label={t('signup.emailAddress')}
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            icon={Mail}
            autoComplete="email"
            disabled={loading}
          />

          {/* Password Input */}
          <div className="auth-input-group">
            <Input
              label={t('signup.password')}
              type={hidePassword ? 'password' : 'text'}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              icon={Lock}
              autoComplete="new-password"
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

            {/* Password Strength Indicator */}
            {password.length > 0 && (
              <div className="auth-password-strength-container">
                <div className="auth-password-strength-bar">
                  {[1, 2, 3, 4, 5].map((segment) => (
                    <div
                      key={segment}
                      className="auth-password-strength-segment"
                      style={{
                        backgroundColor: segment <= passwordStrength.score ? passwordStrength.color : Colors.neutral[200],
                      }}
                    />
                  ))}
                </div>
                <p className="auth-password-strength-text" style={{ color: passwordStrength.color }}>
                  {passwordStrength.label}
                </p>

                {/* Password Requirements */}
                <div className="auth-password-requirements">
                  {passwordStrength.requirements.map((req, index) => (
                    <div key={index} className="auth-requirement-item">
                      <CheckCircle
                        size={12}
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

          {/* Terms and Privacy + EULA checkbox (App Store guideline 1.2) */}
          <div
            className="auth-terms-container"
            style={{
              backgroundColor: Colors.neutral[50],
              padding: '16px',
              borderRadius: '12px',
              marginBottom: '24px',
            }}
          >
            <label style={{ display: 'flex', alignItems: 'flex-start', gap: '10px', cursor: 'pointer' }}>
              <input
                type="checkbox"
                checked={eulaAccepted}
                onChange={(e) => setEulaAccepted(e.target.checked)}
                style={{
                  width: '18px',
                  height: '18px',
                  marginTop: '2px',
                  accentColor: Colors.primary[600],
                  cursor: 'pointer',
                }}
              />
              <span className="auth-terms-text" style={{ color: Colors.neutral[700], fontSize: '13px', lineHeight: '18px' }}>
                {t('signup.byCreatingAccount')}{' '}
                <a
                  href="/terms"
                  className="auth-terms-link"
                  style={{ color: Colors.primary[600], fontWeight: 500 }}
                  target="_blank"
                  rel="noreferrer"
                >
                  {t('signup.termsOfService')}
                </a>
                {' '}{t('signup.and')}{' '}
                <a
                  href="/privacy"
                  className="auth-terms-link"
                  style={{ color: Colors.primary[600], fontWeight: 500 }}
                  target="_blank"
                  rel="noreferrer"
                >
                  {t('signup.privacyPolicy')}
                </a>
                {'. '}
                <span style={{ color: Colors.neutral[600], fontSize: '12px' }}>{t('moderation.zeroTolerance')}</span>
              </span>
            </label>
          </div>

          {/* Sign Up Button */}
          <button
            type="submit"
            disabled={!isFormValid || loading}
            className="auth-primary-button"
            style={{
              backgroundColor: (!isFormValid || loading) ? Colors.neutral[300] : Colors.primary[600],
              boxShadow: (!isFormValid || loading) ? 'none' : `0 4px 12px rgba(0, 0, 0, 0.15)`,
            }}
          >
            {loading ? (
              <span style={{ color: Colors.white, fontWeight: '600' }}>
                {t('signup.creatingAccount')}
              </span>
            ) : (
              <span style={{ color: Colors.white, fontWeight: '600' }}>
                {t('signup.createAccountButton')}
              </span>
            )}
          </button>

          {/* Divider */}
          <div className="auth-divider">
            <div className="auth-divider-line" style={{ backgroundColor: Colors.neutral[200] }} />
            <span className="auth-divider-text" style={{ color: Colors.neutral[500] }}>
              {t('signup.or')}
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
              {t('signup.continueWithGoogle')}
            </span>
          </button>

          {/* Apple Sign-In Button */}
          <button
            type="button"
            onClick={handleAppleSignIn}
            disabled={loading}
            className="auth-google-button"
            style={{
              backgroundColor: Colors.neutral[900],
              borderColor: Colors.neutral[700],
              color: Colors.white,
            }}
          >
            <svg 
              width="20" 
              height="20" 
              viewBox="0 0 24 24" 
              fill="currentColor"
              style={{ marginRight: '12px' }}
            >
              <path d="M17.05 20.28c-.98.95-2.05.88-3.08.4-1.09-.5-2.08-.48-3.24 0-1.44.62-2.2.44-3.06-.4C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 1.51.12 2.65.72 3.4 1.8-3.12 1.87-2.38 5.98.48 7.13-.57 1.5-1.31 2.99-2.54 4.09l.01-.01zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z"/>
            </svg>
            <span style={{ color: Colors.white, fontWeight: '600' }}>
              {t('signup.continueWithApple')}
            </span>
          </button>

          {/* Divider */}
          <div className="auth-divider">
            <div className="auth-divider-line" style={{ backgroundColor: Colors.neutral[200] }} />
            <span className="auth-divider-text" style={{ color: Colors.neutral[500] }}>
              {t('signup.or')}
            </span>
            <div className="auth-divider-line" style={{ backgroundColor: Colors.neutral[200] }} />
          </div>

          {/* Login Section */}
          <div
            className="auth-signup-container"
            style={{
              backgroundColor: Colors.neutral[50],
            }}
          >
            <p className="auth-signup-text" style={{ color: Colors.neutral[700] }}>
              {t('signup.alreadyHaveAccount')}
            </p>
            <button
              type="button"
              onClick={handleLogin}
              className="auth-signup-button"
              style={{
                backgroundColor: Colors.white,
                borderColor: Colors.primary[200],
              }}
            >
              <span
                className="auth-signup-button-text"
                style={{
                  color: Colors.primary[700],
                }}
              >
                {t('signup.signIn')}
              </span>
            </button>
          </div>
        </form>

        {/* Footer */}
        <div className="auth-footer">
          <p className="auth-footer-text" style={{ color: Colors.neutral[500] }}>
            {t('signup.joinThousands')}
          </p>
        </div>
      </div>
    </div>
  )
}
