import { useState, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/lib/supabase';
import { Database } from '@/types/supabase';

type Profile = Database['public']['Tables']['profiles']['Row'];

// Cache for profile data to avoid unnecessary fetches
const profileCache = new Map<string, { data: Profile; timestamp: number }>();
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

// Utility function to create message objects with consistent references
const createMessage = (type: 'success' | 'error', text: string) => ({ type, text });

export function useAuth() {
  const navigate = useNavigate()
  const [user, setUser] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  
  // Use ref to prevent multiple concurrent profile fetches
  const fetchingProfile = useRef<Promise<void> | null>(null);


  const fetchProfile = useCallback(async (userId: string, forceRefresh = false) => {
    // Return existing promise if already fetching
    if (fetchingProfile.current && !forceRefresh) {
      return fetchingProfile.current;
    }

    // Check cache first (but always refresh avatar_url if forceRefresh is true)
    if (!forceRefresh) {
      const cached = profileCache.get(userId);
      if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
        setUser(cached.data);
        return;
      }
    } else {
      // Clear cache when force refreshing
      profileCache.delete(userId);
    }

    const fetchPromise = (async () => {
      try {
        console.log('🔍 Fetching profile for user:', userId);
        // OPTIMIZATION: Use essential fields only for faster initial load
        const profilePromise = supabase
          .from('profiles')
          .select(`
            id, email, full_name, role, avatar_url, verified
          `)
          .eq('id', userId)
          .single();

        const timeoutPromise = new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Profile fetch timeout')), 10000)
        );

        const { data: profile, error: profileError } = await Promise.race([
          profilePromise,
          timeoutPromise
        ]) as any;

        if (profileError) {
          console.error('❌ Profile fetch error:', profileError);
          throw new Error(`Failed to fetch profile: ${profileError.message}`);
        }

        if (!profile) {
          console.error('❌ Profile not found for user:', userId);
          throw new Error('Profile not found. Please try signing in again.');
        }

        console.log('✅ Profile fetched successfully:', profile);

        // OPTIMIZATION: Create minimal profile object for faster processing
        const minimalProfile = {
          id: profile.id,
          email: profile.email,
          full_name: profile.full_name,
          role: profile.role,
          avatar_url: profile.avatar_url ?? null,
          verified: profile.verified ?? null,
          // Set other fields to null for now
          created_at: null,
          updated_at: null,
          email_verified: null,
          verification_token: null,
          verification_token_expires_at: null,
          phone: null,
          location: null,
          bio: null,
          date_of_birth: null,
          gender: null,
          occupation: null,
          company: null,
          website: null,
          social_links: null,
          preferences: null,
          emergency_contact: null,
          address: null,
          is_public: null,
          last_seen: null,
          average_rating: null,
          badge_earned_at: null,
          is_verified_agent: null,
          total_properties: null,
          total_reviews: null,
          verification_badge: null
        };
        
        // Cache the minimal result
        profileCache.set(userId, { data: minimalProfile, timestamp: Date.now() });
        setUser(minimalProfile);
        
        console.log('Profile fetched - Avatar URL:', minimalProfile.avatar_url);
        
        // OPTIMIZATION: Defer full profile fetch and push notifications
        // Web: Push notifications not available
      } catch (error: any) {
        console.error('Profile fetch error:', error);
        setError(error.message || 'Failed to fetch profile');
        throw error;
      }
    })();

    fetchingProfile.current = fetchPromise as any;
    await fetchPromise;
    fetchingProfile.current = null;
  }, []);

  const signIn = useCallback(async (email: string, password: string) => {
    try {
      setLoading(true);
      setError(null);
      setMessage(null);

      const trimmedEmail = email.toLowerCase().trim();

      // Add timeout to prevent hanging
      const signInPromise = supabase.auth.signInWithPassword({
        email: trimmedEmail,
        password,
      });
      
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Sign in timeout')), 15000)
      );

      const { data: passwordData, error: passwordError } = await Promise.race([
        signInPromise,
        timeoutPromise
      ]) as any;

      if (!passwordError && passwordData?.user) {
        // Fetch profile and navigate concurrently
        const profilePromise = fetchProfile(passwordData.user.id);
        
        // Navigate immediately based on user role
        const userRole = passwordData.user.user_metadata?.role;
        if (userRole === 'agent' || userRole === 'landlord') {
          navigate('/agent');
        } else {
          navigate('/user');
        }
        
        // OPTIMIZATION: Don't await profile fetch - let it happen in background
        profilePromise.catch((error: any) => {
          console.error('Background profile fetch failed:', error);
        });
        
        // Web: Push notifications not available
        
        return { user: passwordData.user, error: null };
      }

      // If password login failed, show clear error message
      if (passwordError) {
        // Check for specific error types and provide user-friendly messages
        if (passwordError.message?.includes('Invalid login credentials') || 
            passwordError.message?.includes('Invalid email or password') ||
            passwordError.message?.includes('Invalid credentials')) {
          throw new Error('Invalid email or password. Please check your credentials and try again.');
        } else if (passwordError.message?.includes('Email not confirmed')) {
          throw new Error('Please verify your email address before signing in. Check your inbox for a verification email.');
        } else if (passwordError.message?.includes('Too many requests')) {
          throw new Error('Too many login attempts. Please wait a few minutes before trying again.');
        } else if (passwordError.message?.includes('User not found')) {
          throw new Error('No account found with this email address. Please check your email or create a new account.');
        }
        throw passwordError;
      }

      // If no user returned, it's an authentication failure
      throw new Error('Invalid email or password. Please check your credentials and try again.');
    } catch (error: any) {
      console.error('Sign in error:', error);
      
      // Provide user-friendly error messages
      let errorMessage = 'Login failed. Please check your credentials.';
      
      if (error.message?.includes('Invalid email or password') || 
          error.message?.includes('Invalid login credentials') ||
          error.message?.includes('Invalid credentials')) {
        errorMessage = 'Invalid email or password. Please check your credentials and try again.';
      } else if (error.message?.includes('Email not confirmed')) {
        errorMessage = 'Please verify your email address before signing in. Check your inbox for a verification email.';
      } else if (error.message?.includes('Too many requests')) {
        errorMessage = 'Too many login attempts. Please wait a few minutes before trying again.';
      } else if (error.message?.includes('User not found')) {
        errorMessage = 'No account found with this email address. Please check your email or create a new account.';
      } else if (error.message?.includes('timeout')) {
        errorMessage = 'Login timeout. Please check your internet connection and try again.';
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      setError(errorMessage);
      setMessage({ type: 'error', text: errorMessage });
      return { user: null, error: errorMessage };
    } finally {
      setLoading(false);
    }
  }, [fetchProfile, navigate]);

  const signUp = useCallback(async (email: string, password: string, fullName: string, role: 'normal' | 'agent' | 'landlord' = 'normal') => {
    try {
      setLoading(true);
      setError(null);
      setMessage(null);
      
      // Validate inputs
      if (!email || !password || !fullName) {
        throw new Error('Please fill in all required fields');
      }
      if (password.length < 8) {
        throw new Error('Password must be at least 8 characters long');
      }
      
      const trimmedEmail = email.toLowerCase().trim();
      
      // Check if email already exists
      console.log('🔍 Checking if email already exists:', trimmedEmail);
      
      // Check if user exists in profiles table
      const { data: existingProfile, error: profileError } = await supabase
        .from('profiles')
        .select('id, email')
        .eq('email', trimmedEmail)
        .single();
      
      if (existingProfile && !profileError) {
        console.log('❌ Email already exists in profiles:', existingProfile);
        throw new Error('An account with this email already exists. Please use a different email or try signing in.');
      }
      
      // Save email for verification
      try {
        localStorage.setItem('pendingVerificationEmail', trimmedEmail)
      } catch (e) {
        console.error('Failed to save email:', e)
      }
      
      // Add timeout to prevent hanging
      const signUpPromise = supabase.auth.signUp({
        email: trimmedEmail,
        password,
        options: {
          data: {
            full_name: fullName.trim(),
            role: role,
          },
        },
      });

      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Sign up timeout')), 15000)
      );

      const { data, error } = await Promise.race([
        signUpPromise,
        timeoutPromise
      ]) as any;
      
      console.log('🔍 Signup response:', { data, error });
      console.log('🔍 User data:', data?.user);
      console.log('🔍 Email confirmed at:', data?.user?.email_confirmed_at);
      
      if (error) {
        console.error('❌ Signup error:', error);
        throw new Error(error.message);
      }
      
      // Check if email confirmation is required
      if (data.user && !data.user.email_confirmed_at) {
        console.log('📧 Email confirmation required - user not confirmed');
        setMessage({ 
          type: 'success', 
          text: 'Account created! Please check your email (including spam folder) for verification.' 
        });
        navigate('/auth/verify');
      } else {
        console.log('✅ User already confirmed or no confirmation needed');
        console.log('🔍 User email_confirmed_at:', data?.user?.email_confirmed_at);
        setMessage({ 
          type: 'success', 
          text: 'Account created successfully! You can now sign in.' 
        });
        
        // Register for push notifications after successful signup
        // Web: Push notifications not available
        
        navigate('/auth/login');
      }
    } catch (error: any) {
      console.error('Sign up error:', error);
      setError(error.message);
      setMessage({ type: 'error', text: error.message || 'Failed to create account. Please try again.' });
    } finally {
      setLoading(false);
    }
  }, []);

  const verifyOTP = useCallback(async (code: string, mode?: string) => {
    try {
      setLoading(true);
      setError(null);
      setMessage(null);
      
      if (!code || code.length !== 6) {
        throw new Error('Please enter a valid 6-digit verification code');
      }
      
      // OPTIMIZATION: Cache email lookup to avoid repeated AsyncStorage calls
      let email: string | null = null;
      try {
        // Try verification email first, then reset email
        email = await localStorage.getItem('pendingVerificationEmail');
        if (!email) {
          email = await localStorage.getItem('pendingPasswordResetEmail');
        }
      } catch (storageError) {
        console.warn('AsyncStorage error:', storageError);
      }
      
      if (!email) {
        throw new Error('No email found for verification. Please try again.');
      }
      
      const otpType = mode === 'reset' ? 'recovery' : 'email';
      
      // OPTIMIZATION: Increased timeout for slower connections
      const verifyPromise = supabase.auth.verifyOtp({
        email,
        token: code,
        type: otpType,
      });

      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Verification timeout - please check your connection')), 20000)
      );

      const { data, error } = await Promise.race([
        verifyPromise,
        timeoutPromise
      ]) as any;
      
      if (error) {
        throw new Error(error.message);
      }
      
      if (!data.user) {
        throw new Error('Failed to verify code');
      }
      
      // OPTIMIZATION: Batch operations and navigate immediately
      if (mode === 'reset') {
        // Clear stored emails and navigate immediately
        Promise.all([
          localStorage.removeItem('pendingVerificationEmail'),
          localStorage.removeItem('pendingPasswordResetEmail')
        ]).catch(console.error);
        
        setMessage({ type: 'success', text: 'Code verified! You can now reset your password.' });
        
        // Navigate immediately without waiting
        setTimeout(() => navigate('/auth/reset-password'), 0);
      } else {
        // OPTIMIZATION: Navigate immediately, defer profile fetching
        const userRole = data.user.user_metadata?.role;
        const targetRoute = (userRole === 'agent' || userRole === 'landlord') ? '/agent' : '/user';
        
        setMessage({ type: 'success', text: 'Email verified successfully!' });
        
        // Navigate immediately for better UX
        setTimeout(() => navigate(targetRoute), 0);
        
        // Fetch profile after navigation
        setTimeout(() => {
          fetchProfile(data.user.id, true).catch(error => {
            console.error('Profile fetch failed:', error);
          });
        }, 100);
        
        // OPTIMIZATION: Defer profile fetching to not block navigation
        // Web: Push notifications not available
      }
    } catch (error: any) {
      console.error('OTP verification error:', error);
      setError(error.message);
      setMessage({ type: 'error', text: error.message || 'Failed to verify code' });
    } finally {
      setLoading(false);
    }
  }, [fetchProfile]);

  const resendVerification = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      const email = await localStorage.getItem('pendingVerificationEmail');
      if (!email) {
        throw new Error('No email found for verification');
      }
      
      // OPTIMIZATION: Increased timeout for better reliability
      const resendPromise = supabase.auth.resend({
        type: 'signup',
        email: email
      });

      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Resend timeout - please check your connection')), 15000)
      );

      const { error } = await Promise.race([
        resendPromise,
        timeoutPromise
      ]) as any;
      
      if (error) {
        throw new Error(error.message);
      }
      
      setMessage({ type: 'success', text: 'Verification email sent! Please check your email.' });
    } catch (error: any) {
      console.error('Resend verification error:', error);
      setError(error.message);
      setMessage({ type: 'error', text: error.message || 'Failed to resend verification email' });
    } finally {
      setLoading(false);
    }
  }, []);

  const forgotPassword = useCallback(async (email: string) => {
    try {
      setLoading(true);
      setError(null);
      setMessage(null);
      
      if (!email) {
        throw new Error('Please enter your email address');
      }
      
      const trimmedEmail = email.toLowerCase().trim();
      
      // Add timeout
      const resetPromise = supabase.auth.resetPasswordForEmail(trimmedEmail);
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Password reset timeout - please check your connection')), 20000)
      );

      // Store emails
      try {
        localStorage.setItem('pendingPasswordResetEmail', trimmedEmail);
        localStorage.setItem('pendingVerificationEmail', trimmedEmail);
      } catch (e) {
        console.error('Failed to save to localStorage:', e);
      }
      
      const { error } = await Promise.race([
        resetPromise,
        timeoutPromise
      ]) as any;
      
      if (error) {
        throw new Error(error.message);
      }
      
      setMessage(createMessage('success', 'Password reset code sent to your email!'));
      // Navigation is handled by the calling component
    } catch (error: any) {
      console.error('Forgot password error:', error);
      setError(error.message);
      setMessage(createMessage('error', error.message || 'Failed to send reset email'));
    } finally {
      setLoading(false);
    }
  }, []);

  const resetPassword = useCallback(async (newPassword: string) => {
    try {
      setLoading(true);
      setError(null);
      setMessage(null);
      
      if (!newPassword || newPassword.length < 8) {
        throw new Error('Password must be at least 8 characters long');
      }
      
      // Add timeout
      const updatePromise = supabase.auth.updateUser({ password: newPassword });
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Password update timeout - please check your connection')), 20000)
      );

      const { error } = await Promise.race([
        updatePromise,
        timeoutPromise
      ]) as any;
      
      if (error) {
        throw new Error(error.message);
      }
      
      // Clear stored emails
      try {
        localStorage.removeItem('pendingPasswordResetEmail');
        localStorage.removeItem('pendingVerificationEmail');
      } catch (e) {
        console.error('Failed to clear localStorage:', e);
      }
      
      setMessage({ type: 'success', text: 'Password reset successful!' });
      navigate('/auth/login');
    } catch (error: any) {
      console.error('Reset password error:', error);
      setError(error.message);
      setMessage({ type: 'error', text: error.message || 'Failed to reset password' });
    } finally {
      setLoading(false);
    }
  }, []);

  const signOut = useCallback(async () => {
    try {
      setLoading(true);
      setMessage(null);
      
      // Sign out from Supabase
      const { error } = await supabase.auth.signOut();

      if (error) {
        throw new Error(`Sign out failed: ${error.message}`);
      }
      
      setUser(null);
      profileCache.clear(); // Clear cache
      
      // Clear stored auth data
      try {
        localStorage.removeItem('userProfile');
        localStorage.removeItem('pendingVerificationEmail');
        localStorage.removeItem('pendingPasswordResetEmail');
      } catch (e) {
        console.error('Failed to clear localStorage:', e);
      }
      
      navigate('/guest');
      // Don't set loading to false here - let the redirect happen
      // The loading state will be reset when the component unmounts
    } catch (error: any) {
      console.error('Sign out error:', error);
      setError(error.message);
      setMessage({ type: 'error', text: error.message || 'Failed to sign out' });
      setLoading(false); // Only set loading to false on error
    }
  }, []);

  const deleteAccount = useCallback(async () => {
    try {
      if (!user?.id) throw new Error('No authenticated user');
      setLoading(true);
      setMessage(null);

      // Soft-delete profile and anonymize PII
      const { error: profileError } = await supabase
        .from('profiles')
        .update({
          full_name: 'Deleted User',
          email: null,
          phone: null,
          avatar_url: null,
          bio: null,
          deleted_at: new Date().toISOString(),
        } as any)
        .eq('id', user.id);

      if (profileError) {
        throw profileError;
      }

      // Sign out after delete
      await supabase.auth.signOut();
      setUser(null);
      profileCache.clear();
      navigate('/guest');
    } catch (error: any) {
      console.error('Delete account error:', error);
      setError(error.message);
      setMessage({ type: 'error', text: error.message || 'Failed to delete account' });
      throw error;
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  const clearMessage = useCallback(() => {
    setMessage(null);
    setError(null);
  }, []);

  const clearAuthMessages = useCallback(() => {
    setMessage(null);
    setError(null);
  }, []);

  const refreshUser = useCallback(async () => {
    if (!user?.id) return;
    await fetchProfile(user.id, true);
  }, [user?.id, fetchProfile]);

  const verifyEmail = useCallback(async (email: string, code: string) => {
    return verifyOTP(code, 'email');
  }, [verifyOTP]);

  const resendVerificationCode = useCallback(async (email: string, mode?: string) => {
    try {
      setLoading(true);
      setError(null);
      
      // Use provided email or fallback to localStorage
      let emailToUse = email;
      if (!emailToUse) {
        emailToUse = await localStorage.getItem('pendingVerificationEmail') || '';
        if (!emailToUse) {
          emailToUse = await localStorage.getItem('pendingPasswordResetEmail') || '';
        }
      }
      
      if (!emailToUse) {
        throw new Error('No email found for verification');
      }
      
      // Determine the mode if not provided
      const resendMode = mode || (await localStorage.getItem('pendingPasswordResetEmail') ? 'reset' : 'verify');
      
      // OPTIMIZATION: Add timeout to resend operations
      const resendOperation = resendMode === 'reset' 
        ? supabase.auth.resetPasswordForEmail(emailToUse)
        : supabase.auth.resend({ type: 'signup', email: emailToUse });
      
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Resend timeout - please check your connection')), 15000)
      );
      
      const { error } = await Promise.race([
        resendOperation,
        timeoutPromise
      ]) as any;
      
      if (error) {
        throw new Error(error.message);
      }
      
      const successMessage = resendMode === 'reset'
        ? 'Password reset code sent! Please check your email.'
        : 'Verification email sent! Please check your email.';
      
      setMessage({ type: 'success', text: successMessage });
    } catch (error: any) {
      console.error('Resend verification code error:', error);
      setError(error.message);
      setMessage({ type: 'error', text: error.message || 'Failed to resend verification email' });
      throw error;
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    user,
    loading,
    error,
    message,
    signIn,
    signUp,
    verifyOTP,
    verifyEmail,
    resendVerification,
    resendVerificationCode,
    forgotPassword,
    resetPassword,
    signOut,
    deleteAccount,
    clearMessage,
    clearAuthMessages,
    isAuthenticated: !!user,
    setMessage,
    fetchProfile,
    refreshUser,
  };
}
