import { ChallengeType, Filters, LevelType, RANDOM, type Feedback, type Question } from '@repo/shared-types'
import { getSupabaseClient } from './supabase'
import { createSessionToken, getYesterdayTimestamp, resolveSessionIdFromToken } from './utils'

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
  user_id: string
}

type QuestionGet = {
  id: string
  question: string
  session_id: string
  initial_code?: string
  type: Question['type']
  topic: string
  level: LevelType
  completed: boolean
  critique: string
  score: number 
  missed_points: string[]
  improved_code?: string
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
  Users: 'users'
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

  console.info(`Session data ${data?.id}`)
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
  level?: LevelType,
  type?: ChallengeType,
  user: string
  excludeSessionToken?: string
  limit?: number
}) => {

  const supabase = getSupabaseClient()
  const { topic, level, type, excludeSessionToken, limit = 20, user } = params

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
      .select(`id, session_id, question, initial_code, type, user_id, created_at${innerJoin}`)
      .eq('completed', false)
      .eq('user_id', user)
      .lt('created_at', getYesterdayTimestamp())
      .order('created_at', { ascending: false })
      .range(offset, offset + batchSize - 1)

    if (topic && !isRandomMode) {
      query = query.eq(`${Tables.Sessions}.topic`, topic)
    }

    if (level && !isRandomMode) {
      query = query.eq(`${Tables.Sessions}.level`, level)
    }

    if (type && type !== ChallengeType.Mixed) {
      query = query.eq('type', type)
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
      completed: row.completed,
      user: row.user_id
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

export const upsertQuestion = async (sessionId: string, question: Question, user: string) => {
  const supabase = getSupabaseClient()

  const insertPayload: QuestionInsert = {
    session_id: sessionId,
    question: question.question,
    initial_code: question.initialCode ?? null,
    type: question.type,
    topic: question.topic ?? '',
    level: question.level ?? '',
    user_id: user
  }

  const { data, error } = await supabase
    .from(Tables.Questions)
    .upsert(insertPayload, { onConflict: 'session_id,question' })
    .select('id')
    .single<{ id: string }>()

  if (error) {
    console.log('upsertQuestion error', error.message)
    throw new Error(`Failed to persist question: ${error.message}`)
  }
  return data.id
}

export const completeQuestion = async (questionId: string) => {
  const supabase = getSupabaseClient()

  const insertPayload = {
    completed: true,
  }

  const { data, error } = await supabase
    .from(Tables.Questions)
    .update(insertPayload)
    .eq('id', questionId)
    .select('id')
    .single<{ id: string }>()

  if (error) throw new Error(`Failed to update question: ${JSON.stringify(error)}`)
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

export const listAllQuestions = async (start: string, filters: Filters, user: string)
  : Promise<{ data: Omit<QuestionRow, 'sessionToken' | 'createdAt'>[], count: number }> => {

  const userId = resolveSessionIdFromToken(process.env.HASH_SECRET!, user) ?? ''

  const supabase = getSupabaseClient()

  const { type, topic, level, completed } = filters

  const pageSize = 10

  const offset = Number(start) * pageSize

  const query = supabase
    .from(Tables.Questions)
    .select(`id, question, initial_code, type, completed, topic, level, session_id, ${Tables.Feedback} (critique, score, missed_points, improved_code)`, {
      count: "exact"
    })
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .order('id', { ascending: false })
    .range(offset, offset + pageSize)

  if (type) query.eq('type', type)
  if (topic) query.eq('topic', topic)
  if (level) query.eq('level', level)
  if (completed) query.eq('completed', completed === 'true')

  const { data, error, count } = await query


  if (error) throw new Error(`Failed to load reusable challenges: ${error.message}`)

  return {
    data: (data ?? []).map((row: any) => {
      const feedback = row.interview_feedback?.[0] ?? {}
      const { question, initial_code: initialCode, type, completed, id, level, topic, session_id: sessionId } = row

      return {
        question,
        initialCode,
        type,
        completed,
        id,
        topic,
        level,
        user,
        sessionId,
        score: feedback.score,
        critique: feedback.critique,
        missedPoints: feedback.missed_points,
        improvedCode: feedback.improved_code
      }
    }),
    count: count ?? 0
  }
}

export const getQuestion = async (id: string)
  : Promise<{ data: Omit<QuestionRow, 'sessionToken' | 'createdAt' | 'user'> }> => {

  const supabase = getSupabaseClient()

  const query = supabase
    .from(Tables.Questions)
    .select(`id, question, initial_code, type, completed, topic, level, ${Tables.Feedback} (critique, score, missed_points, improved_code)`, {
      count: "exact"
    })
    .eq('id', id)
    .single<QuestionGet>()
  const { data, error } = await query

  if (error) throw new Error(`Failed to get challenge: ${error.message}`)


  const sessionId = !data.session_id ? (await createSession(data.topic, data.level ?? RANDOM)).id : data.session_id
  
  return {
    data: {
      ...data,
      initialCode: data.initial_code,
      missedPoints: data.missed_points,
      improvedCode: data.improved_code,
      sessionId
    }
  }
}

export const findUser = async (user: string, isNewUser: boolean)
  : Promise<{ id: string | null }> => {

  const supabase = getSupabaseClient()

  if (isNewUser) {
    const { data, error } = await supabase
      .from(Tables.Users)
      .upsert({ username: user })
      .select('id')
      .single<{ id: string }>()

    if (error) throw new Error(`Failed to persist user: ${error.message}`)

    return {
      id: createSessionToken(process.env.HASH_SECRET!, data.id)
    }
  } else {
    const query = supabase
      .from(Tables.Users)
      .select('id')
      .eq('username', user)

    const { data, error } = await query

    if (error) throw new Error(`Failed to load user: ${error.message}`)

    return {
      id: createSessionToken(process.env.HASH_SECRET!, data[0]?.id ?? null)
    }
  }
}
