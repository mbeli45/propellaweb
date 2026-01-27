import { createClient } from '@supabase/supabase-js'
import { Database } from '@/types/supabase'

const supabaseUrl = import.meta.env.VITE_PUBLIC_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_PUBLIC_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Missing Supabase configuration:', {
    url: supabaseUrl ? 'present' : 'missing',
    key: supabaseAnonKey ? 'present' : 'missing'
  })
  throw new Error('Missing Supabase configuration. Please check your environment variables.')
}

// Helper to detect session in URL (for OAuth callbacks)
const detectSessionInUrl = () => {
  if (typeof window === 'undefined') return false
  
  const hashParams = new URLSearchParams(window.location.hash.substring(1))
  const searchParams = new URLSearchParams(window.location.search)
  
  return hashParams.has('access_token') || 
         hashParams.has('refresh_token') ||
         searchParams.has('access_token') ||
         searchParams.has('refresh_token')
}

export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey, {
  auth: {
    flowType: 'pkce',
    debug: import.meta.env.DEV,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: detectSessionInUrl(),
    storage: typeof window !== 'undefined' ? window.localStorage : undefined
  },
  db: {
    schema: 'public'
  },
  global: {
    headers: {
      'X-Client-Info': 'propella-web-app'
    }
  }
})
