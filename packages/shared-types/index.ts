import { z } from 'zod'
import sanitizeHtml from 'sanitize-html'

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
  completed: z.boolean().optional(),
  level: z.string().optional(),
  topic: z.string().optional(),
  user: z.string()
})

export const FeedbackSchema = z.object({
  score: z.number().min(0).max(10).optional()
    .describe('Numeric interview score from 0 to 10.'),
  critique: z.string().optional()
    .describe(
      'A brief overall summary of why the answer did or did not meet the bar. Keep this shorter than missedPoints and focus on the main reasons for the score, not the full teaching detail.'
    ),
  missedPoints: z.array(
    z.string().describe(
      'One clearly explained expectation the candidate missed. Explain what should have been done, mentioned, or justified, why it matters in this specific question, and what a stronger answer would have looked like. Do not write fragment bullets or simply restate that something was missing.'
    )
  ).optional().describe(
    'A list of well-explained missed points. This is the detailed coaching section. Each item should teach the candidate what was expected and how to improve, and should be more detailed than the critique.'
  ),
  improvedCode: z.string().optional()
    .describe('An improved version of the answer when code changes would help. Omit when not applicable.'),
})

export const ChallengeRequestSchema = z.object({
  topic: z.string().min(1),
  level: z.string().min(1),
  previousQuestions: z.array(z.string()).default([]),
  sessionToken: z.string().min(1).optional(),
  user: z.string(),
  options: z.object({
    skipReuse: z.boolean().optional(),
    forceReuse: z.boolean().optional(),
  }).optional(),
})

export const AllChallengesRequestSchema = z.object({
  user: z.string(),
  completed: z.string(),
  start: z.string()
})

export const UserRequestSchema = z.object({
  user: z.string().transform((val) => 
  sanitizeHtml(val)),
  isNewUser: z.boolean()
})

export const UserResponseSchema = z.object({
  id: z.string()
})

export const ChallengeResponseSchema = QuestionSchema.extend({
  sessionToken: z.string().min(1),
  notice: z.string().min(1).optional(),
})

export const EvaluationRequestSchema = z.object({
  user: z.string(),
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
export type UserResponse = z.infer<typeof UserResponseSchema>

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

export const RANDOM = 'random'
