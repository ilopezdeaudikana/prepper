// src/mastra/agents/interview-service.ts
import { interviewAgent, QuestionSchema, type Question, FeedbackSchema } from "./interview-agent"

export const getChallenge = async (topic: string, level: string) => {
  const { object } = await interviewAgent.generate(
    `Generate a ${level} level ${topic} challenge.`,
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

