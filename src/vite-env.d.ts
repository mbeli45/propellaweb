/// <reference types="vite/client" />

// Define __DEV__ global for React Native compatibility
declare const __DEV__: boolean

interface ImportMetaEnv {
  readonly VITE_PUBLIC_SUPABASE_URL: string
  readonly VITE_PUBLIC_SUPABASE_ANON_KEY: string
  readonly VITE_ADMIN_EMAIL?: string
  readonly VITE_ADMIN_EMAILS?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
