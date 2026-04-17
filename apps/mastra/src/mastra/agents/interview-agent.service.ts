import { type Question, QuestionSchema, FeedbackSchema, ChallengeType, MINIMUM_SCORE } from '@repo/shared-types'
import {
  createFeedback,
  createSession,
  getSession,
  listReusableQuestions,
  listQuestionTexts,
  upsertQuestion,
  completeQuestion
} from '../storage/interview-session.repository'
import {
  dedupeQuestions,
  findReusableQuestion,
  isTooSimilar,
} from './interview-agent.helpers'
import { ILogger } from '../logger.service'
import { resolveSessionIdFromToken } from '../storage/utils'
import { interviewAgent } from "./interview-agent"
import { ZodSafeParseResult } from 'zod'

const formatReusableQuestion = async (
  sessionId: string,
  sessionToken: string,
  reusableQuestion: Question,
  notice?: string,
) => {
  const questionId = await upsertQuestion(sessionId, reusableQuestion)
  return {
    id: reusableQuestion.id ?? questionId,
    question: reusableQuestion.question,
    initialCode: reusableQuestion.initialCode,
    type: reusableQuestion.type,
    sessionToken,
    topic: reusableQuestion.topic, level: reusableQuestion.level,
    notice,
  }
}

type ChallengeOptions = { skipReuse?: boolean, forceReuse?: boolean }

type ChallengeSessionContext = {
  session: Awaited<ReturnType<typeof createSession>>
  persistedQuestions: string[]
  allPreviousQuestions: string[]
}

const resolveChallengeSession = async (
  topic: string,
  level: string,
  previousQuestions: string[] = [],
  sessionToken?: string,
): Promise<ChallengeSessionContext> => {
  const sessionId = resolveSessionIdFromToken(process.env.HASH_SECRET!, sessionToken)
  const existingSession = sessionId
    ? await getSession(sessionId)
    : null

  if (sessionId && !existingSession) {
    throw new Error(`Interview session not found: ${sessionId}`)
  }

  const session = existingSession ?? await createSession(topic, level)
  const persistedQuestions = await listQuestionTexts(session.id)
  const allPreviousQuestions = dedupeQuestions([...persistedQuestions, ...previousQuestions])

  return {
    session,
    persistedQuestions,
    allPreviousQuestions,
  }
}

const tryReuseChallenge = async (params: {
  topic: string
  level: string
  sessionId: string
  sessionToken: string
  existingSessionToken?: string
  previousQuestions: string[]
  skipReuse?: boolean
}) => {
  const {
    topic,
    level,
    sessionId,
    sessionToken,
    existingSessionToken,
    previousQuestions,
    skipReuse,
  } = params

  if (skipReuse) {
    return null
  }

  const reusableQuestion = await findReusableQuestion({
    topic,
    level,
    excludeSessionToken: existingSessionToken ?? sessionToken,
    previousQuestions,
  })

  if (!reusableQuestion) {
    return null
  }

  return formatReusableQuestion(sessionId, sessionToken, reusableQuestion)
}

const forceReuseChallenge = async (params: {
  topic: string
  level: string
  sessionId: string
  sessionToken: string
  previousQuestions: string[]
  persistedQuestions: string[]
}) => {
  const { topic, level, sessionId, sessionToken, previousQuestions, persistedQuestions } = params
  // Force reuse path: ignore session boundaries and only avoid repeating the immediately previous challenge.
  const latestQuestion = previousQuestions.at(-1) ?? persistedQuestions.at(-1)
  const fallbackReusable = await findReusableQuestion({
    topic,
    level,
    previousQuestions: latestQuestion ? [latestQuestion] : [],
  })

  if (!fallbackReusable) {
    throw new Error(`No reusable challenge found for topic '${topic}' at level '${level}'`)
  }

  return formatReusableQuestion(sessionId, sessionToken, fallbackReusable)
}

const getRandomStoredChallenge = async (params: {
  sessionId: string
  sessionToken: string
  previousQuestions: string[]
  notice: string
}) => {
  const { sessionId, sessionToken, previousQuestions, notice } = params
  const reusableQuestions = await listReusableQuestions({
    excludeSessionToken: sessionToken,
    limit: 30,
  })

  const unseenQuestions = reusableQuestions.filter(
    (question) => !previousQuestions.includes(question.question)
  )
  const candidates = unseenQuestions.length > 0 ? unseenQuestions : reusableQuestions
  const randomQuestion = candidates[Math.floor(Math.random() * candidates.length)]

  if (!randomQuestion) {
    throw new Error('Skipped generated challenge, but no stored fallback exists')
  }

  return formatReusableQuestion(sessionId, sessionToken, randomQuestion, notice)
}

const formatQuestionExclusions = (questions: string[]) =>
  questions.length
    ? questions.map((question, index) => `${index + 1}. ${question}`).join('\n')
    : 'None'

const buildChallengePrompt = (params: {
  topic: string
  level: string
  variationToken: string
  sessionId: string
  exclusions: string
}) => {
  const { topic, level, variationToken, sessionId, exclusions } = params

  return `Generate one ${level}-level frontend interview challenge about ${topic}.
      Requirements:
      - Return exactly one challenge.
      - The challenge must be meaningfully different from previous ones.
      - Avoid repeating the same underlying task (e.g., counters, toggles, CRUD list variants).
      - Vary both the subtopic and the format (debugging, refactor, feature extension, architecture decision).
      - Use challenge-planning-tool to diversify subtopic/format before finalizing.
      - If sessionId exists, use session-question-history-tool to double-check uniqueness against persisted history.
      - Variation token: ${variationToken}.
      - Current session id: ${sessionId}.

      Previously asked questions to avoid (do not paraphrase these):
      ${exclusions}`
}

const normalizeGeneratedQuestion = (generatedQuestion: unknown) => {
  if (!generatedQuestion || typeof generatedQuestion !== 'object') {
    return generatedQuestion
  }

  return {
    ...generatedQuestion,
    // Backfill type when models omit it.
    type:
      typeof (generatedQuestion as { type?: unknown }).type === 'string'
        ? (generatedQuestion as { type?: string }).type
        : (generatedQuestion as { initialCode?: unknown }).initialCode
          ? ChallengeType.Coding
          : ChallengeType.Theoretical,
    // Ensure initialCode is only set for coding prompts.
    initialCode:
      (generatedQuestion as { initialCode?: unknown }).initialCode &&
        ((generatedQuestion as { type?: unknown }).type ?? undefined) !== ChallengeType.Theoretical
        ? (generatedQuestion as { initialCode?: string }).initialCode
        : undefined,
  }
}

const generateFreshChallenge = async (params: {
  topic: string
  level: string
  sessionId: string
  sessionToken: string
  allPreviousQuestions: string[]
  logger?: ILogger
}) => {
  const { topic, level, sessionId, sessionToken, allPreviousQuestions, logger } = params
  const variationToken = `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`
  const exclusions = formatQuestionExclusions(allPreviousQuestions)
  let lastGenerated: Question | null = null

  const generationResponse = await interviewAgent.generate(buildChallengePrompt({
    topic,
    level,
    variationToken,
    sessionId,
    exclusions,
  }),
    {
      structuredOutput: {
        schema: QuestionSchema,
        jsonPromptInjection: true,
      },
    })


  const generatedQuestion = { ...generationResponse.object, topic, level }
  if (!generatedQuestion) {
    const rawText = generationResponse.text ?? ''
    logger?.error('INTERVIEW_AGENT: missing structured output for challenge', {
      topic,
      level,
      hasText: Boolean(generationResponse.text),
      textPreview: rawText.slice(0, 2000),
    })
    throw new Error('Challenge generation returned no structured output')
  }

  const parsed = QuestionSchema.safeParse(normalizeGeneratedQuestion(generatedQuestion))

  if (parsed.success) {
    lastGenerated = parsed.data
  } else {
    throw new Error('Unable to parse generated question')
  }


  // logger?.info('', JSON.stringify(lastGenerated))

  if (lastGenerated) {
    if (!isTooSimilar(lastGenerated.question, allPreviousQuestions)) {
      const questionId = await upsertQuestion(sessionId, lastGenerated)
      return {
        ...lastGenerated,
        id: lastGenerated.id ?? questionId,
        sessionToken,
      }
    }

    return getRandomStoredChallenge({
      sessionId,
      sessionToken,
      previousQuestions: allPreviousQuestions,
      notice: 'We skipped a too-similar generated question and loaded a random stored challenge instead.',
    })
  }

  throw new Error('Challenge generation did not produce a usable question')
}

export const getChallenge = async (
  topic: string,
  level: string,
  previousQuestions: string[] = [],
  logger: ILogger | undefined,
  sessionToken?: string,
  options?: ChallengeOptions,
) => {
  const { forceReuse, skipReuse } = options ?? {}

  const { session, persistedQuestions, allPreviousQuestions } = await resolveChallengeSession(
    topic,
    level,
    previousQuestions,
    sessionToken,
  )

  const reusedChallenge = await tryReuseChallenge({
    topic,
    level,
    sessionId: session.id,
    sessionToken: session.sessionToken,
    existingSessionToken: sessionToken,
    previousQuestions: allPreviousQuestions,
    skipReuse,
  })

  if (reusedChallenge) {
    return reusedChallenge
  }

  if (forceReuse) {
    return forceReuseChallenge({
      topic,
      level,
      sessionId: session.id,
      sessionToken: session.sessionToken,
      previousQuestions,
      persistedQuestions,
    })
  }

  return generateFreshChallenge({
    topic,
    level,
    sessionId: session.id,
    sessionToken: session.sessionToken,
    allPreviousQuestions,
    logger,
  })
}

export const submitAnswer = async (
  question: Question,
  userAnswer: string,
  level: string,
  logger: ILogger,
  sessionToken?: string
) => {

  logger.info('submitted', {
    question: !!question, userAnswer: !!userAnswer,
    level: !!level,
    sessionToken: !!sessionToken
  })

  let parsedFeedback: ZodSafeParseResult<{
    score?: number | undefined
    critique?: string | undefined
    missedPoints?: string[] | undefined
    improvedCode?: string | undefined
  }> | null = null

  let sessionId: string | undefined = undefined

  let session: {
    sessionToken: string
    id: string
    topic: string
    level: string
    created_at: string
  } | null = null
  try {
    const generationResponse = await interviewAgent.generate(
      `Level: ${level}
     Question: ${JSON.stringify(question)}
     User Answer: ${userAnswer}

     Evaluate based on the rubric.
     Use rubric-guidance-tool to build deterministic must-check criteria before scoring.
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
      logger.error('INTERVIEW_AGENT: missing structured output for evaluation', {
        level,
        hasText: Boolean(generationResponse.text),
        textPreview: rawText.slice(0, 2000),
      })
      throw new Error('Evaluation generation returned no structured output')
    }
    parsedFeedback = FeedbackSchema.safeParse(generationResponse.object)
    if (!parsedFeedback.success) {
      logger.error('feedback parse error')
      throw new Error('Failed to generate feedback')
    }
  } catch (error) {
    logger.error('Error in feedback generation step')
    throw new Error('Error in feedback generation step')
  }

    return {}

  // try {
  //   sessionId = resolveSessionIdFromToken(process.env.HASH_SECRET!, sessionToken)
  //   if (!sessionId) {
  //     return {
  //       ...parsedFeedback?.data,
  //       sessionToken,
  //     }
  //   }

  //   session = await getSession(sessionId)
  //   if (!session) {
  //     logger.error('Interview session not found')
  //     throw new Error(`Interview session not found: ${sessionId}`)
  //   }
  // } catch (error) {
  //   logger.error('Error dealing with sessions')
  //   throw new Error('Error dealing with sessions')
  // }

  // try {
  //   const questionId = await upsertQuestion(sessionId, question)
  //   await createFeedback({
  //     sessionId: sessionId,
  //     questionId,
  //     answer: userAnswer,
  //     level,
  //     feedback: parsedFeedback?.data,
  //   })

  //   logger.info(`Score ${parsedFeedback?.data.score} for questionId ${questionId}`)

  //   if (parsedFeedback?.data?.score && parsedFeedback?.data?.score > MINIMUM_SCORE) {
  //     try {
  //       await completeQuestion(questionId, parsedFeedback?.data)
  //     } catch (error) {
  //       logger.error(`Error completing challenge ${JSON.stringify(error)}`)
  //     }
  //   }
  // } catch (error) {
  //   logger.error(`Error upserting question, feedback or score`)
  //   throw new Error('Error upserting')
  // }

  // return {
  //   ...parsedFeedback?.data,
  //   sessionToken: session?.sessionToken,
  // }
}
