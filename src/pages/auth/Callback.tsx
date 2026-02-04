import { useEffect, useState } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { handleGoogleCallback } from '@/lib/googleAuth'
import { supabase } from '@/lib/supabase'
import Loader from '@/components/ui/Loader'

export default function AuthCallback() {
  const navigate = useNavigate()
  const location = useLocation()
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const handleCallback = async () => {
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

        // Exchange the code for a session
        const code = searchParams.get('code')
        if (code) {
          console.log('🔐 Exchanging code for session...')
          const { data, error: exchangeError } = await supabase.auth.exchangeCodeForSession(code)
          
          if (exchangeError) {
            console.error('❌ Code exchange error:', exchangeError)
            throw exchangeError
          }
          
          console.log('✅ Session obtained:', data.session?.user?.email)
        }

        // Handle the callback
        const { user, error: callbackError } = await handleGoogleCallback()

        if (callbackError) {
          console.error('❌ Callback error:', callbackError)
          setError(callbackError)
          setTimeout(() => navigate('/auth/login'), 3000)
          return
        }

        if (user) {
          console.log('✅ User authenticated:', user.email)
          
          // Fetch user profile to determine role
          const { data: profile } = await supabase
            .from('profiles')
            .select('role')
            .eq('id', user.id)
            .single()

          // Navigate based on role
          const userRole = profile?.role || 'normal'
          console.log('🔐 Navigating to dashboard for role:', userRole)
          
          if (userRole === 'agent' || userRole === 'landlord') {
            navigate('/agent', { replace: true })
          } else {
            navigate('/user', { replace: true })
          }
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
  }, [navigate, location])

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
