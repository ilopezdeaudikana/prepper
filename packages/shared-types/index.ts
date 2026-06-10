import { z } from 'zod'

export const ChallengeType = {
  Coding: 'coding',
  Theoretical: 'theoretical',
  Mixed: 'mixed'
} as const
export type ChallengeType = (typeof ChallengeType)[keyof typeof ChallengeType]

export const Level = {
  Junior: 'junior',
  Mid: 'mid',
  Senior: 'senior'
} as const
export type LevelType = (typeof Level)[keyof typeof Level]

export const QuestionSchema = z.object({
  id: z.string().optional(),
  sessionId: z.uuid().optional(),
  question: z.string(),
  initialCode: z.string().optional(),
  type: z.enum([ChallengeType.Coding, ChallengeType.Theoretical, ChallengeType.Mixed]).optional(),
  completed: z.boolean().optional(),
  level: z.enum([Level.Junior, Level.Mid, Level.Senior]).optional(),
  topic: z.string().optional(),
  user: z.string().min(1)
})

export const HintQuestionSchema = QuestionSchema.pick({
  question: true,
  initialCode: true,
  type: true,
  level: true,
  topic: true
})

export const HintResponseSchema = z.object({
  text: z.string().trim().min(1)
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
  // optional topic and level for backwards compatibility
  topic: z.string().optional(),
  level: z.enum([Level.Junior, Level.Mid, Level.Senior]).optional(),
  type: z.enum([ChallengeType.Coding, ChallengeType.Theoretical, ChallengeType.Mixed]).optional(),
  previousQuestions: z.array(z.string()).default([]),
  sessionToken: z.string().min(1).optional(),
  user: z.string().min(1),
  options: z.object({
    skipReuse: z.boolean().optional(),
    forceReuse: z.boolean().optional(),
  }).optional(),
})

export const ChallengeDeleteSchema = z.object({
  id: z.string()
})

export const AllChallengesRequestSchema = z.object({
  user: z.string().min(1),
  completed: z.string().optional(),
  topic: z.string().optional(),
  level: z.enum([Level.Junior, Level.Mid, Level.Senior]).optional(),
  type: z.enum([ChallengeType.Coding, ChallengeType.Theoretical, ChallengeType.Mixed]).optional(),
  start: z.string()
})

export const UserRequestSchema = z.object({
  user: z.string()
    .trim()
    .min(3)
    .max(32)
    .regex(/^[a-zA-Z0-9_-]+$/),
  isNewUser: z.boolean(),
})

export const UserResponseSchema = z.object({
  id: z.string()
})

export const ChallengeResponseSchema = QuestionSchema.extend({
  sessionToken: z.string().min(1),
  notice: z.string().min(1).optional(),
})

export const EvaluationRequestSchema = z.object({
  question: QuestionSchema,
  answer: z.string().min(1),
  level: z.enum([Level.Junior, Level.Mid, Level.Senior]).optional(),
  sessionToken: z.string().min(1).optional(),
})

export const HintRequestSchema = z.object({
  question: HintQuestionSchema,
  answer: z.string().optional(),
  level: z.enum([Level.Junior, Level.Mid, Level.Senior]).optional()
})

export const EvaluationResponseSchema = FeedbackSchema.extend({
  sessionToken: z.string().min(1).optional(),
})

export type Question = z.infer<typeof QuestionSchema>
export type Hint = z.infer<typeof HintQuestionSchema>
export type Feedback = z.infer<typeof FeedbackSchema> & { error?: string }
export type ChallengeRequest = z.infer<typeof ChallengeRequestSchema>
export type ChallengeResponse = z.infer<typeof ChallengeResponseSchema>
export type EvaluationRequest = z.infer<typeof EvaluationRequestSchema>
export type EvaluationResponse = z.infer<typeof EvaluationResponseSchema>
export type HintResponse = z.infer<typeof HintResponseSchema>
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

export const MINIMUM_SCORE = 7

export const RANDOM = 'random'

export interface Filters {
  type?: ChallengeType
  level?: LevelType
  completed?: string
  topic?: string
}
