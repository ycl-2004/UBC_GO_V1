import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

// Better error message for production builds
if (!supabaseUrl || !supabaseAnonKey) {
  const isProduction = import.meta.env.PROD
  const errorMessage = isProduction
    ? 'Missing Supabase environment variables. Please check GitHub Secrets configuration.'
    : 'Missing Supabase environment variables. Please check your .env.local file.'
  
  console.error('Supabase configuration error:', {
    hasUrl: !!supabaseUrl,
    hasKey: !!supabaseAnonKey,
    env: import.meta.env.MODE,
    isProduction
  })
  
  throw new Error(errorMessage)
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
    storage: typeof window !== 'undefined' ? window.localStorage : undefined,
    storageKey: 'supabase.auth.token'
  }
})

