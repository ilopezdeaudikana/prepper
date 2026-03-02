import { createClient, type SupabaseClient } from '@supabase/supabase-js'

let cachedClient: SupabaseClient | null = null

const getRequiredEnv = (name: 'SUPABASE_URL' | 'SUPABASE_SERVICE_ROLE_KEY') => {
  const value = process.env[name]
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`)
  }
  return value
}

export const getSupabaseClient = () => {
  if (cachedClient) return cachedClient

  cachedClient = createClient(
    getRequiredEnv('SUPABASE_URL'),
    getRequiredEnv('SUPABASE_SERVICE_ROLE_KEY'),
    {
      auth: {
        persistSession: false,
      },
    }
  )

  return cachedClient
}
