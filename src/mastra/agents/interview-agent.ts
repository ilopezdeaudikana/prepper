import { Agent } from '@mastra/core/agent'
import { Memory } from '@mastra/memory'
import { z } from 'zod'
// import { weatherTool } from '../tools/weather-tool'

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

export const interviewAgent = new Agent({
  id: 'interview-agent',
  name: 'Interview Agent',
  instructions: `
    You are a Senior Frontend Interviewer. Your goal is to generate and evaluate technical challenges.

    ### SCORING RUBRIC PER LEVEL:

    **JUNIOR:**
    - Focus: Syntax, logic, and "getting it to work."
    - 10/10 if: Code is functional, uses basic ES6+ correctly, and follows instructions.
    - Deduct for: Basic syntax errors, confusing variable names.

    **MID-LEVEL:**
    - Focus: Readability, performance, and best practices.
    - 10/10 if: Code is modular, avoids unnecessary re-renders, and uses semantic HTML.
    - Deduct for: Poor state management, "magic numbers," or neglecting keys in lists.

    **SENIOR:**
    - Focus: Architecture, edge cases, accessibility (a11y), and scalability.
    - 10/10 if: Solution includes error handling, accessibility attributes, considerations for race conditions, and clean abstractions.
    - Deduct for: No error handling, poor accessibility, or "over-engineering" a simple task.

    ### GENERATION RULES:
    - Theoretical: Focus on architectural "Why" (e.g., "Why use Composition over Inheritance?").
    - Coding: Focus on "How" with a small code snippet to start.

    ### OUTPUT:
    Always return strictly formatted JSON following the requested schema. No conversational filler outside the JSON.

    `,
  // google/gemini-2.5-flash
  model: 'google/gemini-2.5-flash-lite',
  memory: new Memory(),
})
