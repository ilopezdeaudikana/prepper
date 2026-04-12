import { RANDOM, type Feedback, type Question } from '@repo/shared-types'
import { getSupabaseClient } from './supabase'
import { createSessionToken, getYesterdayTimestamp } from './utils'
import { IMastraLogger } from '@mastra/core/logger'

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
  topic: string
  level: string
}

type QuestionRow = Question & {
  sessionId: string
  sessionToken: string
  createdAt: string
} & Feedback

const Tables = {
  Sessions: 'interview_sessions',
  Questions: 'interview_questions',
  Feedback: 'interview_feedback',
} as const

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

  if (error) throw new Error(`Failed to fetch session: ${error.message}`)
  if (!data) return null
  const sessionToken = createSessionToken(process.env.HASH_SECRET!, data.id)
  return { ...data, sessionToken }
}

export const listQuestionTexts = async (sessionId: string) => {
  const supabase = getSupabaseClient()
  const { data, error } = await supabase
    .from(Tables.Questions)
    .select('question')
    .eq('session_id', sessionId)
    .order('created_at', { ascending: true })

  if (error) throw new Error(`Failed to load question history: ${error.message}`)
  return (data ?? []).map((row: any) => row.question as string)
}

export const listReusableQuestions = async (params: {
  topic?: string
  level?: string
  excludeSessionToken?: string
  limit?: number
}) => {
  const supabase = getSupabaseClient()
  const { topic, level, excludeSessionToken, limit = 20 } = params

  const pageSize = limit
  const batchSize = pageSize * 3
  const maxBatches = 3

  const results: QuestionRow[] = []

  const isRandomMode = topic === RANDOM

  const innerJoin = isRandomMode ? '' : `, ${Tables.Sessions}!inner(topic, level)`

  for (let batchIndex = 0; batchIndex < maxBatches && results.length < pageSize; batchIndex += 1) {
    const offset = batchIndex * batchSize
    let query = supabase
      .from(Tables.Questions)
      .select(`id, session_id, question, initial_code, type, created_at${innerJoin}`)
      .eq('completed', false)
      .lt('created_at', getYesterdayTimestamp())
      .order('created_at', { ascending: false })
      .range(offset, offset + batchSize - 1)

    if (topic && !isRandomMode) {
      query = query.eq('interview_sessions.topic', topic)
    }

    if (level && !isRandomMode) {
      query = query.eq('interview_sessions.level', level)
    }

    const { data, error } = await query

    if (error) throw new Error(`Failed to load reusable challenges: ${error.message}`)

    const mapped = (data ?? []).map((row: any) => ({
      id: row.id as string,
      sessionId: row.session_id as string,
      question: row.question as string,
      initialCode: (row.initial_code as string | null) ?? undefined,
      type: row.type as Question['type'],
      createdAt: row.created_at as string,
      sessionToken: createSessionToken(process.env.HASH_SECRET!, row.session_id as string),
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
    topic: question.topic ?? '',
    level: question.level ?? ''
  }

  const { data, error } = await supabase
    .from(Tables.Questions)
    .upsert(insertPayload, { onConflict: 'session_id,question' })
    .select('id')
    .single<{ id: string }>()

  if (error) throw new Error(`Failed to persist question: ${error.message}`)
  return data.id
}

export const completeQuestion = async (questionId: string, solution: Feedback) => {
  const supabase = getSupabaseClient()

  const { improvedCode, critique, score, missedPoints } = solution
  const insertPayload = {
    completed: true,
    improved_code: improvedCode,
    critique,
    score,
    missed_points: missedPoints
  }

  const { data, error } = await supabase
    .from(Tables.Questions)
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

  const { error } = await supabase.from(Tables.Feedback).insert({
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

export const listAllQuestions = async (start: string, completed: string, logger: IMastraLogger)
  : Promise<{ data: Omit<QuestionRow, 'sessionId' | 'sessionToken' | 'createdAt'>[], count: number }> => {
  const supabase = getSupabaseClient()

  const pageSize = 10
  
  const offset =  Number(start) * pageSize

  logger.info(`Start ${start?.toString() ?? ''}`)

  const query = supabase
    .from(Tables.Questions)
    .select(`id, question, initial_code, type, completed, topic, level, ${Tables.Feedback} (critique, score, missed_points, improved_code)`, {
      count: "exact"
    })
    .eq('completed', completed === 'true')
    .order('created_at', { ascending: false })
    .order('id', { ascending: false })
    .range(0, 10)


  const { data, error, count } = await query

  logger.info(`Count ${count?.toString() ?? ''}`)
  

  if (error) throw new Error(`Failed to load reusable challenges: ${error.message}`)

  return { 
    data: (data ?? []).map((row: any) => {
    const feedback = row.interview_feedback?.[0] ?? {}
    const { question, initial_code: initialCode, type, completed, id, level, topic } = row
    logger.info(`Topic ${id} - ${topic}`)
    return {
      question,
      initialCode,
      type,
      completed,
      id,
      topic, 
      level,
      score: feedback.score,
      critique: feedback.critique,
      missedPoints: feedback.missed_points,
      improvedCode: feedback.improved_code
    }
  }),
  count: count ?? 0
 }
}