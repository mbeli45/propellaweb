import { supabaseDataProvider } from 'ra-supabase';
import { createClient } from '@supabase/supabase-js';
import { Database } from '@/types/supabase';

// Get Supabase configuration from environment
const supabaseUrl = import.meta.env.VITE_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error(
    'Missing Supabase configuration. Please check your environment variables:\n' +
    `VITE_PUBLIC_SUPABASE_URL: ${supabaseUrl ? 'present' : 'missing'}\n` +
    `VITE_PUBLIC_SUPABASE_ANON_KEY: ${supabaseAnonKey ? 'present' : 'missing'}`
  );
}

// Create a dedicated Supabase client for react-admin
// This ensures ra-supabase can properly access the URL
const adminSupabaseClient = createClient<Database>(supabaseUrl, supabaseAnonKey, {
  auth: {
    flowType: 'pkce',
    autoRefreshToken: true,
    persistSession: true,
    storage: typeof window !== 'undefined' ? window.localStorage : undefined
  },
  db: {
    schema: 'public'
  }
});

export const dataProvider = supabaseDataProvider({
  instanceUrl: supabaseUrl,
  apiKey: supabaseAnonKey,
  supabaseClient: adminSupabaseClient,
});
