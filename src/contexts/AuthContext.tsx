import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react'
import { supabase } from '@/lib/supabase'
import { Database } from '@/types/supabase'
import { useNavigate } from 'react-router-dom'

type Profile = Database['public']['Tables']['profiles']['Row']

interface AuthContextProps {
  user: Profile | null
  loading: boolean
  error: string | null
  signIn: (email: string, password: string) => Promise<void>
  signUp: (email: string, password: string, fullName: string, role: string) => Promise<void>
  signOut: () => Promise<void>
  refreshUser: () => Promise<void>
  forgotPassword: (email: string) => Promise<void>
  resetPassword: (newPassword: string, token?: string) => Promise<void>
  verifyEmail: (email: string, code: string) => Promise<void>
  verifyOTP: (code: string, mode?: string, email?: string) => Promise<void>
  resendVerificationCode: (email: string, mode?: string) => Promise<void>
}

const AuthContext = createContext<AuthContextProps | undefined>(undefined)

const profileCache = new Map<string, { data: Profile; timestamp: number }>()
const CACHE_DURATION = 5 * 60 * 1000 // 5 minutes

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<Profile | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const navigate = useNavigate()

  const fetchProfile = useCallback(async (userId: string, forceRefresh = false) => {
    if (!forceRefresh) {
      const cached = profileCache.get(userId)
      if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
        setUser(cached.data)
        return
      }
    } else {
      profileCache.delete(userId)
    }

    try {
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single()

      if (profileError) throw profileError
      if (!profile) throw new Error('Profile not found')

      const profileData = profile as Profile
      profileCache.set(userId, { data: profileData, timestamp: Date.now() })
      setUser(profileData)
    } catch (err: any) {
      console.error('Error fetching profile:', err)
      setError(err.message)
    }
  }, [])

  useEffect(() => {
    // Check for existing session
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        fetchProfile(session.user.id)
      }
      setLoading(false)
    })

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        fetchProfile(session.user.id, true)
      } else {
        setUser(null)
        profileCache.clear()
      }
      setLoading(false)
    })

    return () => subscription.unsubscribe()
  }, [fetchProfile])

  const signIn = useCallback(async (email: string, password: string) => {
    try {
      setError(null)
      const { data, error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (signInError) throw signInError
      if (data.user) {
        // Fetch the profile first
        const { data: profile, error: profileError } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', data.user.id)
          .single()

        if (profileError) throw profileError
        if (!profile) throw new Error('Profile not found')

        const profileData = profile as Profile
        
        // Update cache and state
        profileCache.set(data.user.id, { data: profileData, timestamp: Date.now() })
        setUser(profileData)

        // Navigate based on role
        const targetRoute = (profileData.role === 'agent' || profileData.role === 'landlord') ? '/agent' : '/user'
        console.log('🔐 [signIn] Navigating to:', targetRoute, '| User role:', profileData.role)
        navigate(targetRoute)
      }
    } catch (err: any) {
      setError(err.message)
      throw err
    }
  }, [navigate])

  const signUp = useCallback(async (email: string, password: string, fullName: string, role: string) => {
    try {
      setError(null)
      const { data, error: signUpError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: fullName,
            role: role || 'user',
          },
        },
      })

      if (signUpError) throw signUpError
      if (data.user) {
        await fetchProfile(data.user.id, true)
        navigate('/auth/verify')
      }
    } catch (err: any) {
      setError(err.message)
      throw err
    }
  }, [fetchProfile, navigate])

  const signOut = useCallback(async () => {
    try {
      setError(null)
      const { error: signOutError } = await supabase.auth.signOut()
      if (signOutError) throw signOutError
      setUser(null)
      profileCache.clear()
      navigate('/auth/login')
    } catch (err: any) {
      setError(err.message)
      throw err
    }
  }, [navigate])

  const refreshUser = useCallback(async () => {
    if (user?.id) {
      await fetchProfile(user.id, true)
    }
  }, [user?.id, fetchProfile])

  const forgotPassword = useCallback(async (email: string) => {
    try {
      setError(null)
      const { error: resetError } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/auth/reset-password`,
      })
      if (resetError) throw resetError
    } catch (err: any) {
      setError(err.message)
      throw err
    }
  }, [])

  const resetPassword = useCallback(async (newPassword: string, token?: string) => {
    try {
      setError(null)
      const { error: updateError } = await supabase.auth.updateUser({
        password: newPassword
      })
      if (updateError) throw updateError
    } catch (err: any) {
      setError(err.message)
      throw err
    }
  }, [])

  const verifyEmail = useCallback(async (email: string, code: string) => {
    try {
      setError(null)
      const { data, error: verifyError } = await supabase.auth.verifyOtp({
        email,
        token: code,
        type: 'email',
      })
      if (verifyError) throw verifyError
      if (data.user) {
        await fetchProfile(data.user.id, true)
        navigate('/')
      }
    } catch (err: any) {
      setError(err.message)
      throw err
    }
  }, [fetchProfile, navigate])

  const verifyOTP = useCallback(async (code: string, mode?: string, providedEmail?: string) => {
    try {
      setError(null)
      
      if (!code || code.length !== 6) {
        throw new Error('Please enter a valid 6-digit verification code')
      }
      
      // Get email: prioritize provided email, then query string, then localStorage
      let email: string | null = providedEmail || null
      
      if (!email) {
        // Try to get from URL query string
        try {
          const urlParams = new URLSearchParams(window.location.search)
          email = urlParams.get('email')
        } catch (e) {
          console.warn('Failed to read query string:', e)
        }
      }
      
      if (!email) {
        // Fallback to localStorage
        try {
          email = localStorage.getItem('pendingVerificationEmail')
          if (!email) {
            email = localStorage.getItem('pendingPasswordResetEmail')
          }
        } catch (storageError) {
          console.warn('localStorage error:', storageError)
        }
      }
      
      if (!email) {
        throw new Error('No email found for verification. Please try again.')
      }
      
      const otpType = mode === 'reset' ? 'recovery' : 'email'
      
      const { data, error: verifyError } = await supabase.auth.verifyOtp({
        email,
        token: code,
        type: otpType,
      })
      
      if (verifyError) throw verifyError
      
      if (!data.user) {
        throw new Error('Failed to verify code')
      }
      
      // Handle navigation based on mode
      if (mode === 'reset') {
        // Clear stored emails
        try {
          localStorage.removeItem('pendingVerificationEmail')
          localStorage.removeItem('pendingPasswordResetEmail')
        } catch (e) {
          console.warn('Failed to clear localStorage:', e)
        }
        navigate('/auth/reset-password')
      } else {
        // Fetch profile and navigate based on role
        await fetchProfile(data.user.id, true)
        const userRole = data.user.user_metadata?.role
        const targetRoute = (userRole === 'agent' || userRole === 'landlord') ? '/agent' : '/user'
        navigate(targetRoute)
      }
    } catch (err: any) {
      setError(err.message)
      throw err
    }
  }, [fetchProfile, navigate])

  const resendVerificationCode = useCallback(async (email: string, mode?: string) => {
    try {
      setError(null)
      
      // Use provided email or fallback to localStorage
      let emailToUse = email
      if (!emailToUse) {
        emailToUse = localStorage.getItem('pendingVerificationEmail') || ''
        if (!emailToUse) {
          emailToUse = localStorage.getItem('pendingPasswordResetEmail') || ''
        }
      }
      
      if (!emailToUse) {
        throw new Error('No email found for verification')
      }
      
      // Determine the mode if not provided
      const resendMode = mode || (localStorage.getItem('pendingPasswordResetEmail') ? 'reset' : 'verify')
      
      if (resendMode === 'reset') {
        const { error: resetError } = await supabase.auth.resetPasswordForEmail(emailToUse)
        if (resetError) throw resetError
      } else {
        const { error: resendError } = await supabase.auth.resend({
          type: 'signup',
          email: emailToUse,
        })
        if (resendError) throw resendError
      }
    } catch (err: any) {
      setError(err.message)
      throw err
    }
  }, [])

  return (
    <AuthContext.Provider value={{ 
      user, 
      loading, 
      error, 
      signIn, 
      signUp, 
      signOut, 
      refreshUser,
      forgotPassword,
      resetPassword,
      verifyEmail,
      verifyOTP,
      resendVerificationCode
    }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider')
  }
  return context
}
