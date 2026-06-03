import {
  ChallengeRequestSchema,
  ChallengeResponseSchema,
  EvaluationRequestSchema,
  EvaluationResponseSchema,
  HintRequestSchema,
  HintResponseSchema,
  RANDOM,
} from '@repo/shared-types'
import { createStep, createWorkflow } from '@mastra/core/workflows'
import { getChallenge } from '../agents/challenge.service'
import { submitAnswer } from '../agents/evaluate.service'
import { submitHint } from '../agents/hint.service'

const generateChallengeStep = createStep({
  id: 'generate-challenge-step',
  inputSchema: ChallengeRequestSchema,
  outputSchema: ChallengeResponseSchema,
  execute: async ({ inputData }) => {
    console.info('getChallenge starts')
    return getChallenge(
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
  execute: async ({ inputData }) => {
    console.info(`submitAnswer starts ${inputData?.question.id}`)
    return submitAnswer(
      inputData?.question,
      inputData?.answer,
      inputData?.level,
      inputData?.question.user,
      inputData?.sessionToken
    )
  },
})

const hintStep = createStep({
  id: 'hint-step',
  inputSchema: HintRequestSchema,
  outputSchema: HintResponseSchema,
  execute: async ({ inputData }) => {
    console.log('hint submitted')
    return submitHint(
      inputData?.question,
      inputData?.answer,
      inputData?.level
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

export const hintWorkflow = createWorkflow({
  id: 'hint-workflow',
  inputSchema: HintRequestSchema,
  outputSchema: HintResponseSchema,
})
  .then(hintStep)
  .commit()
