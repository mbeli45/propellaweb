import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { handleGoogleCallback } from '@/lib/googleAuth'
import { handleAppleCallback } from '@/lib/appleAuth'
import { supabase } from '@/lib/supabase'
import Loader from '@/components/ui/Loader'
import { useAuth } from '@/contexts/AuthContext'

export default function AuthCallback() {
  const navigate = useNavigate()
  const { user, loading, refreshUser } = useAuth()
  const [error, setError] = useState<string | null>(null)
  const [callbackComplete, setCallbackComplete] = useState(false)
  const hasHandledRef = useRef(false)

  useEffect(() => {
    if (callbackComplete && !loading && user) {
      const targetRoute = user.role === 'agent' || user.role === 'landlord' ? '/agent' : '/user'
      navigate(targetRoute, { replace: true })
    }
  }, [callbackComplete, loading, navigate, user])

  useEffect(() => {
    const handleCallback = async () => {
      if (hasHandledRef.current) return
      hasHandledRef.current = true

      try {
        console.log('🔐 Auth callback - URL:', window.location.href)
        console.log('🔐 Hash:', window.location.hash)
        console.log('🔐 Search:', window.location.search)

        // Check if we have an error in the URL
        const hashParams = new URLSearchParams(window.location.hash.substring(1))
        const searchParams = new URLSearchParams(window.location.search)
        
        const errorParam = hashParams.get('error') || searchParams.get('error')
        const errorDescription = hashParams.get('error_description') || searchParams.get('error_description')
        
        if (errorParam) {
          console.error('❌ OAuth error:', errorParam, errorDescription)
          setError(errorDescription || errorParam)
          setTimeout(() => navigate('/auth/login'), 3000)
          return
        }

        // Exchange the code for a session only when one does not already exist.
        // This avoids PKCE verifier races/duplicate exchange attempts.
        const {
          data: { session: existingSession }
        } = await supabase.auth.getSession()

        const code = searchParams.get('code')
        if (!existingSession && code) {
          console.log('🔐 Exchanging code for session...')
          const { data, error: exchangeError } = await supabase.auth.exchangeCodeForSession(code)
          
          if (exchangeError) {
            console.error('❌ Code exchange error:', exchangeError)
            throw exchangeError
          }
          
          console.log('✅ Session obtained:', data.session?.user?.email)
        }

        // Determine which provider was used and handle callback accordingly
        const { data: { session } } = await supabase.auth.getSession()
        const provider = session?.user?.app_metadata?.provider || 'google'
        
        console.log('🔐 OAuth provider:', provider)
        
        let callbackResult
        if (provider === 'apple') {
          callbackResult = await handleAppleCallback()
        } else {
          callbackResult = await handleGoogleCallback()
        }

        const { user, error: callbackError } = callbackResult

        if (callbackError) {
          console.error('❌ Callback error:', callbackError)
          setError(callbackError)
          setTimeout(() => navigate('/auth/login'), 3000)
          return
        }

        if (user) {
          console.log('✅ User authenticated:', user.email)
          
          // Ensure first-time OAuth users have a profile before routing.
          await refreshUser(user.id)
          setCallbackComplete(true)
        } else {
          console.log('❌ No user found, redirecting to login')
          navigate('/auth/login', { replace: true })
        }
      } catch (err: any) {
        console.error('❌ Auth callback error:', err)
        setError(err.message || 'Authentication failed')
        setTimeout(() => navigate('/auth/login'), 3000)
      }
    }

    handleCallback()
  }, [navigate, refreshUser])

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: '100vh',
      padding: '20px',
    }}>
      {error ? (
        <>
          <p style={{ color: 'red', marginBottom: '16px', textAlign: 'center' }}>{error}</p>
          <p>Redirecting to login...</p>
        </>
      ) : (
        <>
          <Loader />
          <p style={{ marginTop: '16px' }}>Completing sign in...</p>
        </>
      )}
    </div>
  )
}
