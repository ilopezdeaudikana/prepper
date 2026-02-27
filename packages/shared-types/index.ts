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

export type Question = z.infer<typeof QuestionSchema>
export type Feedback = z.infer<typeof FeedbackSchema>
