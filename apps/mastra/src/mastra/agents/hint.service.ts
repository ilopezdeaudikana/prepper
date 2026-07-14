import {
  type Question,
  HintResponseSchema,
  Hint,
  Level,
  LevelType,
  RANDOM,
  ChallengeType,
} from '../../../../../packages/shared-types'

import { interviewAgent } from './interview-agent'
import { getRubricGuidance } from '../tools/interview.tools'

const resolveQuestionType = (
  question: Pick<Question, 'question' | 'topic' | 'initialCode' | 'type'>,
) =>
  question.type === ChallengeType.Coding || question.initialCode
    ? ChallengeType.Coding
    : ChallengeType.Theoretical

const buildHintPrompt = (
  level: LevelType | undefined,
  question: Pick<Question, 'question' | 'topic' | 'initialCode' | 'type'>,
  userAnswer: string | undefined,
) => {
  const effectiveLevel = level ?? Level.Mid
  const rubricGuidance = getRubricGuidance(effectiveLevel, resolveQuestionType(question))

  return `Level: ${effectiveLevel}
     Question: ${JSON.stringify(question)}
     User Answer: ${userAnswer?.trim() || '(no answer yet)'}
     Rubric guidance: ${JSON.stringify(rubricGuidance)}

     Generate exactly one useful hint for the candidate. This is help before submission, not evaluation.

     Use the provided rubric guidance to identify the most important expectation for this level and question type.

     Return only a JSON object with exactly one field:
     {"text":"your hint here"}

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
     Keep it to 1-3 sentences and under 80 words.`
}

const generateStructuredHint = async (prompt: string) => {
  const generationResponse = await interviewAgent.generate(
    prompt,
    {
      structuredOutput: {
        schema: HintResponseSchema,
        jsonPromptInjection: true,
      },
    },
  )

  const parsedHint = HintResponseSchema.safeParse(generationResponse.object)
  if (!parsedHint.success) {
    console.error('Hint structured output parse error', {
      issues: parsedHint.error.issues,
      // textPreview: generationResponse.text?.slice(0, 1000),
      // object: generationResponse.object,
    })
    throw new Error('Failed to generate hint')
  }

  return parsedHint.data
}

const generateHint = async (
  level: LevelType | undefined,
  question: Pick<Question, 'question' | 'topic' | 'initialCode' | 'type'>,
  userAnswer: string | undefined,
) => {
  console.info('Generate hint')

  const prompt = buildHintPrompt(level, question, userAnswer)

  try {
    return await generateStructuredHint(prompt)
  } catch (error) {
    console.warn('Retrying hint generation after structured output failure', JSON.stringify(error))
    try {
      return await generateStructuredHint(
        `${prompt}

        Your previous response did not match the required JSON shape.
        Return valid JSON only, with no markdown, no prose outside JSON, and a non-empty "text" string.`,
      )
    } catch (retryError) {
      console.error('Error in hint generation step', JSON.stringify(retryError))
      throw retryError
    }
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
      { 
        question, 
        topic: topic ?? RANDOM, 
        initialCode: initialCode ?? '', 
        type 
      },
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
