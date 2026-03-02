import { z } from 'zod'

export const QuestionSchema = z.object({
  question: z.string(),
  initialCode: z.string().optional(),
  type: z.enum(['coding', 'theoretical']),
})

export const FeedbackSchema = z.object({
  score: z.number().min(0).max(10),
  critique: z.string(),
  missedPoints: z.array(z.string()),
  improvedCode: z.string().optional(),
})

export const ChallengeRequestSchema = z.object({
  topic: z.string().min(1),
  level: z.string().min(1),
  previousQuestions: z.array(z.string()).default([]),
  sessionId: z.string().uuid().optional(),
})

export const ChallengeResponseSchema = QuestionSchema.extend({
  sessionId: z.string().uuid(),
})

export const EvaluationRequestSchema = z.object({
  question: QuestionSchema,
  answer: z.string().min(1),
  level: z.string().min(1),
  sessionId: z.string().uuid().optional(),
})

export const EvaluationResponseSchema = FeedbackSchema.extend({
  sessionId: z.string().uuid().optional(),
})

export type Question = z.infer<typeof QuestionSchema>
export type Feedback = z.infer<typeof FeedbackSchema>
export type ChallengeRequest = z.infer<typeof ChallengeRequestSchema>
export type ChallengeResponse = z.infer<typeof ChallengeResponseSchema>
export type EvaluationRequest = z.infer<typeof EvaluationRequestSchema>
export type EvaluationResponse = z.infer<typeof EvaluationResponseSchema>
