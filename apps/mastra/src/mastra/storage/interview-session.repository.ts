import { type Feedback, type Question } from '@repo/shared-types'
import { getSupabaseClient } from './supabase'
import { getYesterdayTimestamp, hmacHex } from './utils'

type InterviewSession = {
  id: string
  topic: string
  level: string
  created_at: string
}

type QuestionInsert = {
  session_id: string
  question: string
  initial_code?: string | null
  type: Question['type']
}

type QuestionRow = Question & {
  sessionId: string
  sessionToken: string
  createdAt: string
}

const TABLES = {
  sessions: 'interview_sessions',
  questions: 'interview_questions',
  feedback: 'interview_feedback',
} as const

export const createSession = async (topic: string, level: string) => {
  const supabase = getSupabaseClient()
  const { data, error } = await supabase
    .from(TABLES.sessions)
    .insert({ topic, level })
    .select('id, topic, level, created_at')
    .single<InterviewSession>()

  if (error) throw new Error(`Failed to create session: ${error.message}`)
  const sessionToken = hmacHex(process.env.HASH_SECRET!, data.id)
  return { ...data, sessionToken }
}

export const getSession = async (sessionId: string) => {
  const supabase = getSupabaseClient()
  const { data, error } = await supabase
    .from(TABLES.sessions)
    .select('id, topic, level, created_at')
    .eq('id', sessionId)
    .maybeSingle<InterviewSession>()

  if (error) throw new Error(`Failed to fetch session: ${error.message}`)
  if (!data) return null
  const sessionToken = hmacHex(process.env.HASH_SECRET!, data.id)
  return { ...data, sessionToken }
}

export const listQuestionTexts = async (sessionId: string) => {
  const supabase = getSupabaseClient()
  const { data, error } = await supabase
    .from(TABLES.questions)
    .select('question')
    .eq('session_id', sessionId)
    .order('created_at', { ascending: true })

  if (error) throw new Error(`Failed to load question history: ${error.message}`)
  return (data ?? []).map((row: any) => row.question as string)
}

export const listReusableQuestions = async (params: {
  topic: string
  level: string
  excludeSessionToken?: string
  limit?: number
}) => {
  const supabase = getSupabaseClient()
  const { topic, level, excludeSessionToken, limit = 20 } = params

  const pageSize = limit
  const batchSize = pageSize * 3
  const maxBatches = 3

  const results: QuestionRow[] = []

  for (let batchIndex = 0; batchIndex < maxBatches && results.length < pageSize; batchIndex += 1) {
    const offset = batchIndex * batchSize
    const { data, error } = await supabase
      .from(TABLES.questions)
      .select('id, session_id, question, initial_code, type, created_at, interview_sessions!inner(topic, level)')
      .lt('created_at', getYesterdayTimestamp())
      .eq('interview_sessions.topic', topic)
      .eq('interview_sessions.level', level)
      .order('created_at', { ascending: false })
      .range(offset, offset + batchSize - 1)

    if (error) throw new Error(`Failed to load reusable challenges: ${error.message}`)

    const mapped = (data ?? []).map((row: any) => ({
      id: row.id as string,
      sessionId: row.session_id as string,
      question: row.question as string,
      initialCode: (row.initial_code as string | null) ?? undefined,
      type: row.type as Question['type'],
      createdAt: row.created_at as string,
      sessionToken: hmacHex(process.env.HASH_SECRET!, row.session_id as string),
      completed: row.completed
    }))

    const filtered = excludeSessionToken
      ? mapped.filter((row) => row.sessionToken !== excludeSessionToken)
      : mapped

    for (const row of filtered) {
      if (results.length >= pageSize) break
      results.push(row)
    }

    if ((data ?? []).length < batchSize) break
  }

  return results
}

export const upsertQuestion = async (sessionId: string, question: Question) => {
  const supabase = getSupabaseClient()

  const insertPayload: QuestionInsert = {
    session_id: sessionId,
    question: question.question,
    initial_code: question.initialCode ?? null,
    type: question.type,
  }

  const { data, error } = await supabase
    .from(TABLES.questions)
    .upsert(insertPayload, { onConflict: 'session_id,question' })
    .select('id')
    .single<{ id: string }>()

  if (error) throw new Error(`Failed to persist question: ${error.message}`)
  return data.id
}

export const completeQuestion = async (questionId: string) => {
  const supabase = getSupabaseClient()

  const insertPayload = {
    completed: true
  }

  const { data, error } = await supabase
    .from(TABLES.questions)
    .update(insertPayload)
    .eq('id', questionId)
    .select('id')
    .single<{ id: string }>()

  if (error) throw new Error(`Failed to update question: ${questionId}`)
  else if (!data) {
    throw new Error(`No row matched ${questionId}`)
  } 

 
  return data.id
}


export const createFeedback = async (params: {
  sessionId: string
  questionId: string
  answer: string
  level: string
  feedback: Feedback
}) => {
  const supabase = getSupabaseClient()
  const { sessionId, questionId, answer, level, feedback } = params

  const { error } = await supabase.from(TABLES.feedback).insert({
    session_id: sessionId,
    question_id: questionId,
    answer,
    level,
    score: feedback.score,
    critique: feedback.critique,
    missed_points: feedback.missedPoints,
    improved_code: feedback.improvedCode ?? null,
  })

  if (error) throw new Error(`Failed to persist feedback: ${error.message}`)
}
