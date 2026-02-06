import { supabase } from './supabase'

export interface GoogleSignInOptions {
  role?: 'normal' | 'agent' | 'landlord'
}

/**
 * Initiate Google Sign-In flow for web
 * @param options - Optional role selection
 * @returns Promise with user data or error
 */
export async function signInWithGoogle(options?: GoogleSignInOptions) {
  try {
    // Store role selection in localStorage before redirect
    if (options?.role) {
      localStorage.setItem('pendingGoogleRole', options.role)
    }

    // Use environment variable for production, fallback to current origin
    const redirectUrl = import.meta.env.VITE_PUBLIC_SITE_URL 
      ? `${import.meta.env.VITE_PUBLIC_SITE_URL}/auth/callback`
      : `${window.location.origin}/auth/callback`

    console.log('🔐 Google Sign-In redirect URL:', redirectUrl)

    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: redirectUrl,
        queryParams: {
          access_type: 'offline',
          prompt: 'consent',
        },
      },
    })

    if (error) throw error

    // Browser will redirect to Google OAuth page
    return { user: null, error: null }
  } catch (error: any) {
    console.error('Google Sign-In error:', error)
    return { user: null, error: error.message || 'Failed to sign in with Google' }
  }
}

/**
 * Handle OAuth callback and update user role
 * Call this in your auth callback page
 */
export async function handleGoogleCallback() {
  try {
    // Get the session from URL hash
    const { data: { session }, error } = await supabase.auth.getSession()

    if (error) throw error

    if (session?.user) {
      // Check if profile exists
      const { data: existingProfile } = await supabase
        .from('profiles')
        .select('id, role')
        .eq('id', session.user.id)
        .single()

      // If profile doesn't exist, create it
      if (!existingProfile) {
        const pendingRole = localStorage.getItem('pendingGoogleRole') || 'normal'
        
        const { error: profileError } = await supabase
          .from('profiles')
          .insert({
            id: session.user.id,
            email: session.user.email,
            full_name: session.user.user_metadata?.full_name || session.user.user_metadata?.name || 'User',
            role: pendingRole as 'normal' | 'agent' | 'landlord',
            avatar_url: session.user.user_metadata?.avatar_url || session.user.user_metadata?.picture,
          })

        if (profileError) {
          console.error('Failed to create profile:', profileError)
        }
        
        localStorage.removeItem('pendingGoogleRole')
      } else {
        // Profile exists, check if we need to update role
        const pendingRole = localStorage.getItem('pendingGoogleRole')
        
        if (pendingRole && pendingRole !== existingProfile.role) {
          await updateUserRole(session.user.id, pendingRole as any)
        }
        
        localStorage.removeItem('pendingGoogleRole')
      }

      return { user: session.user, error: null }
    }

    return { user: null, error: 'No session found' }
  } catch (error: any) {
    console.error('Google callback error:', error)
    return { user: null, error: error.message }
  }
}

/**
 * Update user role in profile after Google Sign-In
 */
async function updateUserRole(userId: string, role: 'normal' | 'agent' | 'landlord') {
  try {
    const { error } = await supabase
      .from('profiles')
      .update({ role })
      .eq('id', userId)

    if (error) throw error
  } catch (error) {
    console.error('Failed to update user role:', error)
  }
}
