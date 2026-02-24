// src/mastra/agents/interview-service.ts
import { interviewAgent, QuestionSchema, type Question, FeedbackSchema } from "./interview-agent"

export const getChallenge = async (topic: string, level: string) => {
  const variationToken = `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`
  const { object } = await interviewAgent.generate(
    `Generate one ${level}-level frontend interview challenge about ${topic}.
    Requirements:
    - Make this challenge different from previous challenges in this conversation.
    - Vary the subtopic and phrasing.
    - Return exactly one challenge.
    - Variation token: ${variationToken}.`,
    { structuredOutput: { schema: QuestionSchema } }
  )
  return object
}

export const submitAnswer = async (question: Question, userAnswer: string, level: string) => {
  const { object } = await interviewAgent.generate(
    `Level: ${level}
     Question: ${question}
     User Answer: ${userAnswer}

     Evaluate based on the rubric.`,
    { structuredOutput: { schema: FeedbackSchema } }
  )
  return object
}
