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
  sessionToken: z.string().min(1).optional(),
  options: z.object({
    skipReuse: z.boolean().optional(),
    forceReuse: z.boolean().optional(),
  }).optional(),
})

export const ChallengeResponseSchema = QuestionSchema.extend({
  sessionToken: z.string().min(1),
})

export const EvaluationRequestSchema = z.object({
  question: QuestionSchema,
  answer: z.string().min(1),
  level: z.string().min(1),
  sessionToken: z.string().min(1).optional(),
})

export const EvaluationResponseSchema = FeedbackSchema.extend({
  sessionToken: z.string().min(1).optional(),
})

export type Question = z.infer<typeof QuestionSchema>
export type Feedback = z.infer<typeof FeedbackSchema>
export type ChallengeRequest = z.infer<typeof ChallengeRequestSchema>
export type ChallengeResponse = z.infer<typeof ChallengeResponseSchema>
export type EvaluationRequest = z.infer<typeof EvaluationRequestSchema>
export type EvaluationResponse = z.infer<typeof EvaluationResponseSchema>

export const Topic = {
  react: 'react',
  nextjs: 'nextjs',
  typescript: 'typescript',
  javascript: 'javascript',
  css: 'css',
} as const

export type TopicKey = (typeof Topic)[keyof typeof Topic]
