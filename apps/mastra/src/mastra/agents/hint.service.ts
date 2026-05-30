import { type Question, FeedbackSchema, LevelType} from '@repo/shared-types'

import { interviewAgent } from "./interview-agent"
import { IMastraLogger } from '@mastra/core/logger'


const generateHint = async (level: LevelType | undefined, question: Pick<Question, 'question' | 'topic' | 'initialCode' | 'type'>, userAnswer: string) => {
  try {
    const generationResponse = await interviewAgent.generate(
      `Level: ${level}
     Question: ${JSON.stringify(question)}
     User Answer: ${userAnswer}

     Give a hint based on the rubric.
     Use rubric-guidance-tool to build deterministic must-check criteria before scoring.
     Write critique in direct, helpful prose that explains the main reason the answer passed or failed.
     Do not give away the solution.
     For missedPoints:
     - return terse bullet fragments,
     - each item must explain what was expected,
     - explain why that expectation matters for this specific question,
     Keep the tone constructive and specific.`,
      {
        structuredOutput: {
          schema: FeedbackSchema,
          jsonPromptInjection: true,
        },
      }
    )
    if (!generationResponse.object) {
      const rawText = generationResponse.text ?? ''
      console.error('INTERVIEW_AGENT: missing structured output for evaluation', {
        level,
        hasText: Boolean(generationResponse.text),
        textPreview: rawText.slice(0, 2000),
      })
      throw new Error('Evaluation generation returned no structured output')
    }
    const parsedFeedback = FeedbackSchema.safeParse(generationResponse.object)
    if (!parsedFeedback.success) {
      console.error('feedback parse error')
      throw new Error('Failed to generate feedback')
    }
    return parsedFeedback.data
  } catch (error) {
    console.error('Error in feedback generation step', JSON.stringify(error))
    throw error
  }
}

export const submitHint = async (
  logger: IMastraLogger,
  challenge: Question,
  userAnswer: string,
  level: LevelType | undefined
) => {

  try {

    const { question, topic, initialCode, type } = challenge

    const feedback = await generateHint(level, { question, topic, initialCode, type }, userAnswer)

    return {
      ...feedback,
    }
  } catch (error) {
    logger.error(JSON.stringify(error))
    throw error
  }

}