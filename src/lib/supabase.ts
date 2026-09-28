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

export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey, {
  auth: {
    flowType: 'pkce',
    // Off: GoTrue debug logs print the whole session (access + refresh tokens) on every refresh tick.
    debug: false,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true,
    // Let the SDK test storage availability and fall back to memory when blocked.
    // Reading window.localStorage here can throw before React mounts.
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
