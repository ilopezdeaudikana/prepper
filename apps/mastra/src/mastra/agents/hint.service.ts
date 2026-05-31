import {
  type Question,
  HintResponseSchema,
  Hint,
  Level,
  LevelType,
} from '@repo/shared-types'

import { interviewAgent } from './interview-agent'

const generateHint = async (
  level: LevelType | undefined,
  question: Pick<Question, 'question' | 'topic' | 'initialCode' | 'type'>,
  userAnswer: string | undefined,
) => {
  console.log('Generate hint')

  try {
    const generationResponse = await interviewAgent.generate(
      `Level: ${level}
     Question: ${JSON.stringify(question)}
     User Answer: ${userAnswer?.trim() || '(no answer yet)'}

     Generate exactly one useful hint for the candidate. This is help before submission, not evaluation.

     Use rubric-guidance-tool to identify the most important expectation for this level and question type.
     If the question type is mixed, treat it as coding when initialCode is present otherwise treat it as theoretical.

     Return only the 'text' field.

     The hint should:
     - focus on the highest-impact next step the candidate can take,
     - be specific to this exact question and the user's current answer,
     - name one concrete concept, variable, behavior, API, edge case, or tradeoff from the question,
     - point at one specific thing to inspect, test, or reason about,
     - explain briefly why that area matters,
     - sound like an interviewer nudging the candidate, not grading them.

     If the user has not written an answer yet:
     - give a first-step hint about how to start this exact problem,
     - anchor it to the question's requested behavior or constraint.

     The hint must not:
     - give away the final answer or provide a complete implementation,
     - include a score, pass/fail language, critique, missedPoints, or a full checklist,
     - mention the rubric, tool usage, or JSON schema,
     - say to compare the initialCode with the current solution,
     - refer to 'the provided initialCode' or 'your current solution',
     - use generic advice like 'consider edge cases' unless you name the relevant edge case for this question.

     Before returning, reject and rewrite the hint if it could apply to many unrelated interview questions.
     Keep it to 1-3 sentences and under 80 words.`,
      {
        structuredOutput: {
          schema: HintResponseSchema,
          jsonPromptInjection: true,
        },
      },
    )

    const parsedHint = HintResponseSchema.safeParse(generationResponse.object)
    if (!parsedHint.success) {
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
  level: LevelType | undefined,
) => {
  try {
    const { question, topic, initialCode, type } = challenge

    const effectiveLevel = level ?? challenge.level ?? Level.Mid
    const hint = await generateHint(
      effectiveLevel,
      { question, topic, initialCode, type },
      userAnswer,
    )

    return {
      ...hint,
    }
  } catch (error) {
    console.error(JSON.stringify(error))
    throw error
  }
}
