import { type Question, HintResponseSchema, Hint, LevelType} from '@repo/shared-types'

import { interviewAgent } from "./interview-agent"

const generateHint = async (
  level: LevelType | undefined, 
  question: Pick<Question, 'question' | 'topic' | 'initialCode' | 'type'>, 
  userAnswer: string | undefined
) => {
  console.log('Generate hint')

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
     Keep the tone constructive and specific. Be specific but concise, no more than 120 words`,
      {
        structuredOutput: {
          schema: HintResponseSchema,
          jsonPromptInjection: true,
        },
      }
    )

    if (!generationResponse.text) {
      throw new Error('Hint generation returned no structured output')
    }
    const parsedHint = HintResponseSchema.safeParse(generationResponse.object)
    if (!parsedHint.success) {
      console.error('hint parse error')
      throw new Error('Failed to generate hint')
    }
    return parsedHint.data

  } catch (error) {
    console.error('Error in hint generation step', JSON.stringify(error))
    throw error
  }
}

export const submitHint = async (
  challenge: Hint,
  userAnswer: string | undefined,
  level: LevelType | undefined
) => {

  try {

    const { question, topic, initialCode, type } = challenge

    const hint = await generateHint(level, { question, topic, initialCode, type }, userAnswer)

    return {
      ...hint,
    }
  } catch (error) {
    console.error(JSON.stringify(error))
    throw error
  }

}