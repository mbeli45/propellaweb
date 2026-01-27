import React, { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '@/lib/supabase'
import { useThemeMode } from '@/contexts/ThemeContext'
import { getColors } from '@/constants/Colors'
import LoadingScreen from '@/components/LoadingScreen'

export default function Callback() {
  const navigate = useNavigate()
  const { colorScheme } = useThemeMode()
  const Colors = getColors(colorScheme)

  useEffect(() => {
    // Handle OAuth callback
    supabase.auth.getSession().then(({ data: { session }, error }) => {
      if (error) {
        console.error('Auth callback error:', error)
        navigate('/auth/login')
        return
      }

      if (session?.user) {
        // Check user role and redirect accordingly
        const role = session.user.user_metadata?.role || 'user'
        if (role === 'agent' || role === 'landlord') {
          navigate('/agent')
        } else {
          navigate('/user')
        }
      } else {
        navigate('/auth/login')
      }
    })

    // Also listen for auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        const role = session.user.user_metadata?.role || 'user'
        if (role === 'agent' || role === 'landlord') {
          navigate('/agent')
        } else {
          navigate('/user')
        }
      }
    })

    return () => {
      subscription.unsubscribe()
    }
  }, [navigate])

  return <LoadingScreen />
}
