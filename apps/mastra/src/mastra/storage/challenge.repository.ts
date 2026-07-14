import { ChallengeType, Filters, Level, LevelType, RANDOM, type ChallengeDashboardStats, type ChallengeImportItem, type Feedback, type Question } from '../../../../../packages/shared-types'
import { getSupabaseClient } from './supabase'
import { createSessionToken, getYesterdayTimestamp, resolveSessionIdFromToken } from './utils'
import { Tables } from './types'
import { createSession } from './session.repository'

type QuestionInsert = {
  session_id: string
  question: string
  initial_code?: string | null
  type: Question['type']
  topic: string
  level: string
  user_id: string
}

interface FeedbackGet {
  critique: string
  score: number
  missed_points: string[]
  improved_code?: string
}

interface QuestionGet extends FeedbackGet {
  id: string
  question: string
  session_id: string
  initial_code?: string
  created_at?: string
  type: Question['type']
  topic: string
  level: LevelType
  completed: boolean
}

type QuestionReference = {
  id: string
  session_id: string
}

type QuestionRow = Question & {
  sessionId: string
  sessionToken: string
  createdAt: string
} & Feedback

export const listQuestionTexts = async (sessionId: string) => {
  const supabase = getSupabaseClient()
  const { data, error } = await supabase
    .from(Tables.Questions)
    .select('question')
    .eq('session_id', sessionId)
    .order('created_at', { ascending: true })

  if (error) throw new Error(`Failed to load question history: ${error.message}`)
  return (data ?? []).map((row: { question: QuestionGet['question'] }) => row.question)
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

    const mapped = ((data ?? []) as unknown as (QuestionGet & { user_id: string })[]).map((row) => ({
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
    console.info('upsertQuestion error', error.message)
    throw new Error(`Failed to persist question: ${error.message}`)
  }
  return data.id
}

export const findQuestionReference = async (questionId: string, user: string) => {
  const supabase = getSupabaseClient()

  const { data, error } = await supabase
    .from(Tables.Questions)
    .select('id, session_id')
    .eq('id', questionId)
    .eq('user_id', user)
    .maybeSingle<QuestionReference>()

  if (error) throw new Error(`Failed to find question: ${error.message}`)
  return data
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
    data: (data ?? []).map((row) => {
      const feedback = row.interview_feedback?.[0] ?? {} as FeedbackGet
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
    .select(`id, session_id, question, initial_code, type, completed, topic, level, ${Tables.Feedback} (critique, score, missed_points, improved_code)`, {
      count: "exact"
    })
    .eq('id', id)
    .single<QuestionGet>()
  const { data, error } = await query

  if (error) throw new Error(`Failed to get challenge: ${error.message}`)

  const sessionId = !data.session_id ? (await createSession(data.topic ?? RANDOM, data.level ?? RANDOM)).id : data.session_id

  const { question, initial_code: initialCode, type, completed, level, topic, missed_points: missedPoints, improved_code: improvedCode } = data

  return {
    data: {
      question, type, completed, id, topic,
      level: level ?? Level.Mid,
      initialCode: initialCode ?? '',
      missedPoints,
      improvedCode,
      sessionId
    }
  }
}

export const deleteQuestion = async (id: string, user: string)
  : Promise<{ message: string }> => {

  const supabase = getSupabaseClient()

  const userId = resolveSessionIdFromToken(process.env.HASH_SECRET!, user) ?? ''

  console.info('Delete', id, 'for', userId, user)
  const query = supabase
    .from(Tables.Questions)
    .delete()
    .eq('id', id)
    .eq('user_id', userId)

  const { error } = await query

  if (error) throw new Error(`Failed to delete challenge: ${error.message}`)

  return {
    message: `Challenge deleted: ${id}`
  }
}

type DashboardQuestionGet = {
  id: string
  type?: ChallengeType | null
  topic?: string | null
  completed: boolean
  created_at?: string | null
  interview_feedback?: { score?: number | null }[]
}

const increment = <T extends string>(map: Map<T, number>, key: T, amount = 1) => {
  map.set(key, (map.get(key) ?? 0) + amount)
}

export const getChallengeDashboard = async (user: string): Promise<ChallengeDashboardStats> => {
  const supabase = getSupabaseClient()
  const userId = resolveSessionIdFromToken(process.env.HASH_SECRET!, user) ?? ''

  const { data, error } = await supabase
    .from(Tables.Questions)
    .select(`id, type, topic, completed, created_at, ${Tables.Feedback} (score)`)
    .eq('user_id', userId)
    .order('created_at', { ascending: true })

  if (error) throw new Error(`Failed to load dashboard: ${error.message}`)

  const rows = (data ?? []) as DashboardQuestionGet[]
  const solvedByType = new Map<ChallengeType | 'unknown', number>()
  const usageByDate = new Map<string, { date: string, created: number, solved: number }>()
  const topicMap = new Map<string, { topic: string, count: number, solved: number }>()
  const scores: number[] = []

  for (const row of rows) {
    const date = row.created_at ? row.created_at.slice(0, 10) : 'unknown'
    const usage = usageByDate.get(date) ?? { date, created: 0, solved: 0 }
    usage.created += 1
    if (row.completed) usage.solved += 1
    usageByDate.set(date, usage)

    const topic = row.topic?.trim() || 'Uncategorized'
    const topicStats = topicMap.get(topic) ?? { topic, count: 0, solved: 0 }
    topicStats.count += 1
    if (row.completed) topicStats.solved += 1
    topicMap.set(topic, topicStats)

    if (row.completed) {
      increment(solvedByType, row.type ?? 'unknown')
    }

    const score = row.interview_feedback?.[0]?.score
    if (typeof score === 'number') scores.push(score)
  }

  const solved = rows.filter((row) => row.completed).length
  const averageScore = scores.length
    ? Number((scores.reduce((total, score) => total + score, 0) / scores.length).toFixed(1))
    : null

  return {
    total: rows.length,
    solved,
    unsolved: rows.length - solved,
    averageScore,
    solvedByType: Array.from(solvedByType, ([type, count]) => ({ type, count })),
    usageOverTime: Array.from(usageByDate.values()),
    byTopic: Array.from(topicMap.values()).sort((a, b) => b.count - a.count).slice(0, 8)
  }
}

export const importChallenges = async (user: string, challenges: ChallengeImportItem[])
  : Promise<{ inserted: number, ids: string[] }> => {

  const userId = resolveSessionIdFromToken(process.env.HASH_SECRET!, user)
  if (!userId) throw new Error('Invalid user session.')

  const ids: string[] = []

  for (const challenge of challenges) {
    const topic = challenge.topic?.trim() || ''
    const level = challenge.level ?? Level.Mid
    const session = await createSession(topic || RANDOM, level)
    const id = await upsertQuestion(session.id, {
      question: challenge.question,
      initialCode: challenge.initialCode,
      type: challenge.type ?? ChallengeType.Mixed,
      topic,
      level,
      user: userId
    }, userId)
    ids.push(id)
  }

  return {
    inserted: ids.length,
    ids
  }
}
