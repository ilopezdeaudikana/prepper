import {
  ChallengeRequestSchema,
  ChallengeResponseSchema,
  EvaluationRequestSchema,
  EvaluationResponseSchema,
} from '@repo/shared-types'
import { createStep, createWorkflow } from '@mastra/core/workflows'
import { getChallenge, submitAnswer } from '../agents/interview-agent.service'

const generateChallengeStep = createStep({
  id: 'generate-challenge-step',
  inputSchema: ChallengeRequestSchema,
  outputSchema: ChallengeResponseSchema,
  execute: async ({ inputData }) => {
    return getChallenge(
      inputData.topic,
      inputData.level,
      inputData.previousQuestions,
      inputData.sessionId
    )
  },
})

const evaluateAnswerStep = createStep({
  id: 'evaluate-answer-step',
  inputSchema: EvaluationRequestSchema,
  outputSchema: EvaluationResponseSchema,
  execute: async ({ inputData }) => {
    return submitAnswer(
      inputData.question,
      inputData.answer,
      inputData.level,
      inputData.sessionId
    )
  },
})

export const generateChallengeWorkflow = createWorkflow({
  id: 'generate-challenge-workflow',
  inputSchema: ChallengeRequestSchema,
  outputSchema: ChallengeResponseSchema,
})
  .then(generateChallengeStep)
  .commit()

export const evaluateAnswerWorkflow = createWorkflow({
  id: 'evaluate-answer-workflow',
  inputSchema: EvaluationRequestSchema,
  outputSchema: EvaluationResponseSchema,
})
  .then(evaluateAnswerStep)
  .commit()
