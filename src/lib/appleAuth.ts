import { supabase } from './supabase'

export interface AppleSignInOptions {
  role?: 'normal' | 'agent' | 'landlord'
}

/**
 * Initiate Apple Sign-In flow for web
 * @param options - Optional role selection
 * @returns Promise with user data or error
 */
export async function signInWithApple(options?: AppleSignInOptions) {
  try {
    // Store role selection in localStorage before redirect
    if (options?.role) {
      localStorage.setItem('pendingAppleRole', options.role)
    }

    // Always use the current origin so PKCE verifier storage and callback origin match.
    const redirectUrl = `${window.location.origin}/auth/callback`

    console.log('🍎 Apple Sign-In redirect URL:', redirectUrl)

    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: 'apple',
      options: {
        redirectTo: redirectUrl,
        queryParams: {},
      },
    })

    if (error) throw error

    // Browser will redirect to Apple OAuth page
    return { user: null, error: null }
  } catch (error: any) {
    console.error('Apple Sign-In error:', error)
    return { user: null, error: error.message || 'Failed to sign in with Apple' }
  }
}

/**
 * Handle OAuth callback and update user role
 * Call this in your auth callback page
 */
export async function handleAppleCallback() {
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
        const pendingRole = localStorage.getItem('pendingAppleRole') || 'normal'
        
        // Apple provides name in user_metadata, but it might be null on subsequent logins
        const fullName = session.user.user_metadata?.full_name || 
                        session.user.user_metadata?.name || 
                        session.user.user_metadata?.email?.split('@')[0] ||
                        'User'
        
        const { error: profileError } = await supabase
          .from('profiles')
          .insert({
            id: session.user.id,
            email: session.user.email,
            full_name: fullName,
            role: pendingRole as 'normal' | 'agent' | 'landlord',
            avatar_url: session.user.user_metadata?.avatar_url || session.user.user_metadata?.picture,
          })

        if (profileError) {
          console.error('Failed to create profile:', profileError)
        }
        
        localStorage.removeItem('pendingAppleRole')
      } else {
        // Profile exists, check if we need to update role
        const pendingRole = localStorage.getItem('pendingAppleRole')
        
        if (pendingRole && pendingRole !== existingProfile.role) {
          await updateUserRole(session.user.id, pendingRole as any)
        }
        
        localStorage.removeItem('pendingAppleRole')
      }

      return { user: session.user, error: null }
    }

    return { user: null, error: 'No session found' }
  } catch (error: any) {
    console.error('Apple callback error:', error)
    return { user: null, error: error.message }
  }
}

/**
 * Update user role in profile after Apple Sign-In
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
