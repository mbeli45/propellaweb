import { supabaseDataProvider } from 'ra-supabase';
import { supabase } from '@/lib/supabase';

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

// Reuse the shared Supabase client instance to avoid multiple GoTrueClient instances
// This ensures both the admin panel and main app share the same session
export const dataProvider = supabaseDataProvider({
  instanceUrl: supabaseUrl,
  apiKey: supabaseAnonKey,
  supabaseClient: supabase,
});
