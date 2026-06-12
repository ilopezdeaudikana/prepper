import { getSupabaseClient } from './supabase'
import { createSessionToken } from './utils'
import { Tables } from './types'

type InterviewSession = {
  id: string
  topic: string
  level: string
  created_at: string
}

export const createSession = async (topic: string, level: string) => {
  const supabase = getSupabaseClient()
  const { data, error } = await supabase
    .from(Tables.Sessions)
    .insert({ topic, level })
    .select('id, topic, level, created_at')
    .single<InterviewSession>()

  if (error) throw new Error(`Failed to create session: ${error.message}`)
  const sessionToken = createSessionToken(process.env.HASH_SECRET!, data.id)
  return { ...data, sessionToken }
}

export const getSession = async (sessionId: string) => {
  const supabase = getSupabaseClient()
  const { data, error } = await supabase
    .from(Tables.Sessions)
    .select('id, topic, level, created_at')
    .eq('id', sessionId)
    .maybeSingle<InterviewSession>()

  console.info(`Session data ${data?.id}`)
  if (error) throw new Error(`Failed to fetch session: ${error.message}`)
  if (!data) return null
  const sessionToken = createSessionToken(process.env.HASH_SECRET!, data.id)
  return { ...data, sessionToken }
}

