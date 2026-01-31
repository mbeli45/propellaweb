import { AuthProvider as RAuthProvider } from 'react-admin';
import { supabase } from '@/lib/supabase';
import { Database } from '@/types/supabase';

type Profile = Database['public']['Tables']['profiles']['Row'];

// Get admin emails from environment variable (comma-separated)
const getAdminEmails = (): string[] => {
  const adminEmails = import.meta.env.VITE_ADMIN_EMAILS || import.meta.env.VITE_ADMIN_EMAIL;
  if (!adminEmails) return [];
  return adminEmails
    .split(',')
    .map((email: string) => email.toLowerCase().trim())
    .filter((email: string) => email.length > 0);
};

const ADMIN_EMAILS = getAdminEmails();

export const authProvider: RAuthProvider = {
  login: async ({ username, password }) => {
    try {
      // Validate input
      if (!username || !password) {
        throw new Error('Email and password are required');
      }

      // Trim and validate email format
      const email = username.trim().toLowerCase();
      if (!email.includes('@')) {
        throw new Error('Invalid email format');
      }

      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password: password.trim(),
      });

      if (error) {
        console.error('Supabase auth error:', error);
        // Provide user-friendly error messages
        if (error.message?.includes('Invalid login credentials') || error.message?.includes('Email not confirmed')) {
          throw new Error('Invalid email or password. Please check your credentials.');
        }
        if (error.message?.includes('Email rate limit')) {
          throw new Error('Too many login attempts. Please try again later.');
        }
        throw new Error(error.message || 'Authentication failed. Please check your credentials.');
      }

      if (!data.user) {
        throw new Error('Login failed. No user data returned.');
      }

      const userEmail = data.user.email?.toLowerCase().trim();
      
      // Check if user email matches any admin email from .env
      const isAdminEmail = ADMIN_EMAILS.length > 0 && ADMIN_EMAILS.includes(userEmail || '');

      // Check if user has admin, agent, or landlord role
      const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', data.user.id)
        .single();

      // Allow access if:
      // 1. Email matches admin email from .env, OR
      // 2. User has admin role, OR
      // 3. User has agent/landlord role (for agency management)
      const hasAccess = isAdminEmail || 
                        profile?.role === 'admin' || 
                        profile?.role === 'agent' || 
                        profile?.role === 'landlord';

      if (!hasAccess) {
        await supabase.auth.signOut();
        throw new Error('Access denied. Admin privileges required.');
      }

      return Promise.resolve();
    } catch (error: any) {
      console.error('Login error:', error);
      return Promise.reject(error.message || 'Login failed. Please try again.');
    }
  },
  logout: async () => {
    await supabase.auth.signOut();
    return Promise.resolve();
  },
  checkAuth: async () => {
    try {
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      
      if (sessionError) {
        console.error('Session error:', sessionError);
        return Promise.reject();
      }
      
      if (!session || !session.user) {
        console.log('No session found');
        return Promise.reject();
      }

      const userEmail = session.user.email?.toLowerCase().trim();
      const isAdminEmail = ADMIN_EMAILS.length > 0 && ADMIN_EMAILS.includes(userEmail || '');

      // Verify user still has admin access
      const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', session.user.id)
        .single();

      const hasAccess = isAdminEmail || 
                        profile?.role === 'admin' || 
                        profile?.role === 'agent' || 
                        profile?.role === 'landlord';

      if (!hasAccess) {
        console.log('Access denied for user:', userEmail, 'role:', profile?.role);
        return Promise.reject();
      }

      return Promise.resolve();
    } catch (error) {
      console.error('checkAuth error:', error);
      return Promise.reject();
    }
  },
  checkError: (error) => {
    const status = error?.status;
    if (status === 401 || status === 403) {
      return Promise.reject();
    }
    return Promise.resolve();
  },
  getIdentity: async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        throw new Error('No user found');
      }

      const { data: profile } = await supabase
        .from('profiles')
        .select('id, full_name, email, avatar_url, role')
        .eq('id', user.id)
        .single();

      if (!profile) {
        throw new Error('Profile not found');
      }

      return {
        id: profile.id,
        fullName: profile.full_name || profile.email || 'Admin',
        avatar: profile.avatar_url,
        role: profile.role,
      };
    } catch (error) {
      throw error;
    }
  },
  getPermissions: async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        return Promise.resolve('');
      }

      const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single();

      return Promise.resolve(profile?.role || '');
    } catch {
      return Promise.resolve('');
    }
  },
};
