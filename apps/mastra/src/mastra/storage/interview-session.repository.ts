import type { Feedback, Question } from '@repo/shared-types'
import { getSupabaseClient } from './supabase'

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

const TABLES = {
  sessions: 'interview_sessions',
  questions: 'interview_questions',
  feedback: 'interview_feedback',
} as const

export const interviewSessionRepository = {
  async createSession(topic: string, level: string) {
    const supabase = getSupabaseClient()
    const { data, error } = await supabase
      .from(TABLES.sessions)
      .insert({ topic, level })
      .select('id, topic, level, created_at')
      .single<InterviewSession>()

    if (error) throw new Error(`Failed to create session: ${error.message}`)
    return data
  },

  async getSession(sessionId: string) {
    const supabase = getSupabaseClient()
    const { data, error } = await supabase
      .from(TABLES.sessions)
      .select('id, topic, level, created_at')
      .eq('id', sessionId)
      .maybeSingle<InterviewSession>()

    if (error) throw new Error(`Failed to fetch session: ${error.message}`)
    return data
  },

  async listQuestionTexts(sessionId: string) {
    const supabase = getSupabaseClient()
    const { data, error } = await supabase
      .from(TABLES.questions)
      .select('question')
      .eq('session_id', sessionId)
      .order('created_at', { ascending: true })

    if (error) throw new Error(`Failed to load question history: ${error.message}`)
    return (data ?? []).map((row: any) => row.question as string)
  },

  async listReusableQuestions(params: {
    topic: string
    level: string
    excludeSessionId?: string
    limit?: number
  }) {
    const supabase = getSupabaseClient()
    const { topic, level, excludeSessionId, limit = 20 } = params

    let query = supabase
      .from(TABLES.questions)
      .select('session_id, question, initial_code, type, created_at, interview_sessions!inner(topic, level)')
      .eq('interview_sessions.topic', topic)
      .eq('interview_sessions.level', level)
      .order('created_at', { ascending: false })
      .limit(limit)

    if (excludeSessionId) {
      query = query.neq('session_id', excludeSessionId)
    }

    const { data, error } = await query
    if (error) throw new Error(`Failed to load reusable challenges: ${error.message}`)

    return (data ?? []).map((row: any) => ({
      sessionId: row.session_id as string,
      question: row.question as string,
      initialCode: (row.initial_code as string | null) ?? undefined,
      type: row.type as Question['type'],
      createdAt: row.created_at as string,
    }))
  },

  async upsertQuestion(sessionId: string, question: Question) {
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
  },

  async createFeedback(params: {
    sessionId: string
    questionId: string
    answer: string
    level: string
    feedback: Feedback
  }) {
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
  },
}
