import { type Question, FeedbackSchema, MINIMUM_SCORE, Feedback, Level, LevelType, ChallengeType } from '@repo/shared-types'
import {
  createFeedback,
  findQuestionReference,
  completeQuestion
} from '../storage/challenge.repository'

import { resolveSessionIdFromToken } from '../storage/utils'
import { interviewAgent } from "./interview-agent"
import { getRubricGuidance } from '../tools/interview.tools'


const generateReply = async (level: LevelType, question: Pick<Question, 'question' | 'topic' | 'initialCode' | 'type'>, userAnswer: string) => {
  try {
    const rubricGuidance = getRubricGuidance(
      level,
      question.type === ChallengeType.Coding ? ChallengeType.Coding : ChallengeType.Theoretical
    )

    const generationResponse = await interviewAgent.generate(
      `Level: ${level}
     Question: ${JSON.stringify(question)}
     User Answer: ${userAnswer}
     Rubric guidance: ${JSON.stringify(rubricGuidance)}

     Evaluate based on the rubric.
     Use the provided rubric guidance as deterministic must-check criteria before scoring.
     Write critique in direct, helpful prose that explains the main reason the answer passed or failed.
     Do not give vague feedback like "missing a11y" or "did not handle edge cases" unless you immediately explain what accessible implementation or edge-case handling was expected here.
     For critique:
     - keep it shorter than missedPoints,
     - summarize the answer quality and the main reasons for the score,
     - treat it as "you passed/failed mainly because of this".
     For missedPoints:
     - do not return terse bullet fragments,
     - each item must explain what was expected,
     - explain why that expectation matters for this specific question,
     - explain what the candidate should have mentioned, implemented, or justified,
     - treat this as the "this is what you should have done" section.
     Prefer concrete examples of expected behavior, code, or reasoning over labels.
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

const resolveQuestionForFeedback = async (question: Question, user: string) => {
  if (!question.id) {
    throw new Error('Cannot evaluate a question without a persisted question id')
  }

  const reference = await findQuestionReference(question.id, user)
  if (!reference) {
    throw new Error(`Question not found: ${question.id}`)
  }

  return {
    questionId: reference.id,
    sessionId: reference.session_id,
  }
}

const storeFeedback = async (question: Question, answer: string, level: string, feedback: Feedback, user: string) => {
  try {
    const questionReference = await resolveQuestionForFeedback(question, user)
    await createFeedback({
      sessionId: questionReference.sessionId,
      questionId: questionReference.questionId,
      answer,
      level,
      feedback
    })

    console.info(`Score ${feedback.score} for questionId ${questionReference.questionId}, ${MINIMUM_SCORE}`)

    if (feedback.score && feedback.score > MINIMUM_SCORE) {

      await completeQuestion(questionReference.questionId)
    }
  } catch (error) {
    console.error(`Error upserting question, feedback or score`)
    throw error
  }
}


export const submitAnswer = async (
  challenge: Question,
  userAnswer: string,
  level: LevelType | undefined,
  user: string,
  sessionToken?: string
) => {
  try {
    const userId = resolveSessionIdFromToken(process.env.HASH_SECRET!, user) ?? ''

    const { question, topic, initialCode, type } = challenge

    const effectiveLevel = level ?? challenge.level ?? Level.Mid
    const feedback = await generateReply(effectiveLevel, { question, topic, initialCode, type }, userAnswer)

    await storeFeedback(challenge, userAnswer, effectiveLevel, feedback, userId)
    
    return {
      ...feedback,
      sessionToken,
    }
  } catch (error) {
    console.error(JSON.stringify(error))
    throw error
  }

}
