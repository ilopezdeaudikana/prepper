import { z } from 'zod'

export const ChallengeType = {
  Coding: 'coding',
  Theoretical: 'theoretical'
} as const

export type ChallengeKey = (typeof ChallengeType)[keyof typeof ChallengeType]

export const QuestionSchema = z.object({
  id: z.uuid().optional(),
  question: z.string(),
  initialCode: z.string().optional(),
  type: z.enum([ChallengeType.Coding, ChallengeType.Theoretical]).optional(),
  completed: z.boolean().optional()
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
  notice: z.string().min(1).optional(),
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
export type Feedback = z.infer<typeof FeedbackSchema> & { error?: string }
export type ChallengeRequest = z.infer<typeof ChallengeRequestSchema>
export type ChallengeResponse = z.infer<typeof ChallengeResponseSchema>
export type EvaluationRequest = z.infer<typeof EvaluationRequestSchema>
export type EvaluationResponse = z.infer<typeof EvaluationResponseSchema>

export const Topic = {
  React: 'react',
  Nextjs: 'nextjs',
  Node: 'node',
  Typescript: 'typescript',
  Javascript: 'javascript',
  Css: 'css',
} as const

export type TopicKey = (typeof Topic)[keyof typeof Topic]

export const Level = {
  Junior: 'junior',
  Mid: 'mid',
  Senior: 'senior'
} as const

export type LevelKey = (typeof Level)[keyof typeof Level]

export const MINIMUM_SCORE = 7
