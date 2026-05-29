import {
  ChallengeRequestSchema,
  ChallengeResponseSchema,
  EvaluationRequestSchema,
  EvaluationResponseSchema,
  RANDOM,
} from '@repo/shared-types'
import { createStep, createWorkflow } from '@mastra/core/workflows'
import { getChallenge, submitAnswer } from '../agents/interview-agent.service'

const generateChallengeStep = createStep({
  id: 'generate-challenge-step',
  inputSchema: ChallengeRequestSchema,
  outputSchema: ChallengeResponseSchema,
  execute: async ({ inputData, mastra }) => {
    const logger = mastra.getLogger()
    logger.info('getChallenge starts')
    return getChallenge(
      logger,
      inputData.topic ?? RANDOM,
      inputData.level,
      inputData.type,
      inputData.previousQuestions,
      inputData.user,
      inputData.sessionToken,
      inputData.options
    )
  },
})

const evaluateAnswerStep = createStep({
  id: 'evaluate-answer-step',
  inputSchema: EvaluationRequestSchema,
  outputSchema: EvaluationResponseSchema,
  execute: async ({ inputData, mastra }) => {
    const logger = mastra.getLogger()
    logger.info(`submitAnswer starts ${inputData?.sessionId}`)
    return submitAnswer(
      logger,
      inputData?.question,
      inputData?.answer,
      inputData?.level,
      inputData?.question.user,
      inputData?.sessionId,
      inputData?.sessionToken
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
