import { type Question, QuestionSchema, FeedbackSchema, ChallengeType, MINIMUM_SCORE, Feedback, LevelType, RANDOM } from '@repo/shared-types'
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
import { resolveSessionIdFromToken } from '../storage/utils'
import { interviewAgent } from "./interview-agent"
import { IMastraLogger } from '@mastra/core/logger'

type ChallengeOptions = { skipReuse?: boolean, forceReuse?: boolean }

type ChallengeSessionContext = {
  session: Awaited<ReturnType<typeof createSession>>
  persistedQuestions: string[]
  allPreviousQuestions: string[]
}

// GET CHALLENGE HELPERS
const formatReusableQuestion = async (
  sessionId: string,
  sessionToken: string,
  reusableQuestion: Question,
  user: string,
  notice?: string,
) => {
  const questionId = await upsertQuestion(sessionId, reusableQuestion, user)
  return {
    id: reusableQuestion.id ?? questionId,
    question: reusableQuestion.question,
    initialCode: reusableQuestion.initialCode,
    type: reusableQuestion.type,
    sessionToken,
    topic: reusableQuestion.topic, level: reusableQuestion.level,
    notice,
    user,
  }
}

const resolveChallengeSession = async (
  logger: IMastraLogger,
  topic: string,
  level: LevelType | undefined,
  previousQuestions: string[] = [],
  sessionToken?: string,
): Promise<ChallengeSessionContext> => {
  const sessionId = resolveSessionIdFromToken(process.env.HASH_SECRET!, sessionToken)
  const existingSession = sessionId
    ? await getSession(logger, sessionId)
    : null

  if (sessionId && !existingSession) {
    throw new Error(`Interview session not found: ${sessionId}`)
  }

  const session = existingSession ?? await createSession(topic, level ?? RANDOM)
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
  level: LevelType | undefined,
  type: ChallengeType | undefined,
  sessionId: string
  sessionToken: string
  existingSessionToken?: string
  previousQuestions: string[]
  user: string
  skipReuse?: boolean
}) => {
  const {
    topic,
    level,
    type,
    sessionId,
    sessionToken,
    existingSessionToken,
    previousQuestions,
    skipReuse,
    user
  } = params

  if (skipReuse) {
    return null
  }

  const reusableQuestion = await findReusableQuestion({
    topic,
    level,
    type,
    user,
    excludeSessionToken: existingSessionToken ?? sessionToken,
    previousQuestions,
  })

  if (!reusableQuestion) {
    return null
  }

  return formatReusableQuestion(sessionId, sessionToken, reusableQuestion, user)
}

const forceReuseChallenge = async (params: {
  topic: string
  level: LevelType,
  type: ChallengeType,
  sessionId: string
  sessionToken: string
  previousQuestions: string[]
  persistedQuestions: string[]
  user: string
}) => {
  const { topic, level, type, sessionId, sessionToken, previousQuestions, persistedQuestions, user } = params
  // Force reuse path: ignore session boundaries and only avoid repeating the immediately previous challenge.
  const latestQuestion = previousQuestions.at(-1) ?? persistedQuestions.at(-1)
  const fallbackReusable = await findReusableQuestion({
    topic,
    level,
    type,
    user,
    previousQuestions: latestQuestion ? [latestQuestion] : [],
  })

  if (!fallbackReusable) {
    throw new Error(`No reusable challenge found for topic '${topic}' at level '${level}'`)
  }

  return formatReusableQuestion(sessionId, sessionToken, fallbackReusable, user)
}

const getRandomStoredChallenge = async (params: {
  sessionId: string
  sessionToken: string
  previousQuestions: string[]
  notice: string
  user: string
}) => {
  const { sessionId, sessionToken, previousQuestions, notice, user } = params
  const reusableQuestions = await listReusableQuestions({
    user,
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

  return formatReusableQuestion(sessionId, sessionToken, randomQuestion, user, notice)
}

const formatQuestionExclusions = (questions: string[]) =>
  questions.length
    ? questions.map((question, index) => `${index + 1}. ${question}`).join('\n')
    : 'None'

const buildChallengePrompt = (params: {
  topic: string
  level: LevelType,
  type: ChallengeType,
  variationToken: string
  sessionId: string
  exclusions: string
}) => {
  const { topic, level, type, variationToken, sessionId, exclusions } = params
  
  const finalType = type && type !== ChallengeType.Mixed ? type : `${ChallengeType.Coding} or ${ChallengeType.Theoretical}`
  return `Generate one ${level}-level frontend interview challenge about ${topic} of ${finalType} type.
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
  user: string
}) => {
  const { topic, level, sessionId, sessionToken, allPreviousQuestions, user } = params
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


  const generatedQuestion = { ...generationResponse.object, topic, level, user }
  if (!generatedQuestion) {
    const rawText = generationResponse.text ?? ''
    console.error('INTERVIEW_AGENT: missing structured output for challenge', {
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


  // console.info('', JSON.stringify(lastGenerated))

  if (lastGenerated) {
    if (!isTooSimilar(lastGenerated.question, allPreviousQuestions)) {
      const questionId = await upsertQuestion(sessionId, lastGenerated, user)
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
      user
    })
  }

  throw new Error('Challenge generation did not produce a usable question')
}

// END GET CHALLENGE HELPERS

export const getChallenge = async (
  logger: IMastraLogger,
  topic: string,
  level: LevelType | undefined,
  type: ChallengeType | undefined,
  previousQuestions: string[] = [],
  user: string,
  sessionToken?: string,
  options?: ChallengeOptions

) => {
  const { forceReuse, skipReuse } = options ?? {}

  const userId = resolveSessionIdFromToken(process.env.HASH_SECRET!, user) ?? ''

  const { session, persistedQuestions, allPreviousQuestions } = await resolveChallengeSession(
    logger,
    topic,
    level,
    previousQuestions,
    sessionToken,
  )

  const reusedChallenge = await tryReuseChallenge({
    topic,
    level,
    type,
    sessionId: session.id,
    sessionToken: session.sessionToken,
    existingSessionToken: sessionToken,
    previousQuestions: allPreviousQuestions,
    user: userId,
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
      user: userId
    })
  }

  return generateFreshChallenge({
    topic,
    level,
    sessionId: session.id,
    sessionToken: session.sessionToken,
    allPreviousQuestions,
    user: userId
  })
}


// SUBMIT CHALLENGE HELPERS
const generateReply = async (level: LevelType, question: Pick<Question, 'question' | 'topic' | 'initialCode' | 'type'>, userAnswer: string) => {
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

const findSession = async (logger: IMastraLogger, sessionToken: string) => {
  try {
    const sessionId = resolveSessionIdFromToken(process.env.HASH_SECRET!, sessionToken)
    logger.info(`Found sessionId from token, ${sessionId}`)
    if (!sessionId) {
      return
    }
    return await getSession(logger, sessionId)
  } catch (error) {
    console.error('Error dealing with sessions')
    throw error
  }
}

const storeFeedback = async (logger: IMastraLogger, sessionId: string, question: Question, answer: string, level: string, feedback: Feedback, user: string) => {
  logger.info(`storeFeedback:sessionId:${sessionId}`)
  try {
    const questionId = await upsertQuestion(sessionId, question, user)
    await createFeedback({
      sessionId, questionId, answer, level, feedback
    })

    logger.info(`Score ${feedback.score} for questionId ${questionId}, ${MINIMUM_SCORE}`)

    if (feedback.score && feedback.score > MINIMUM_SCORE) {

      await completeQuestion(questionId)
    }
  } catch (error) {
    logger.error(`Error upserting question, feedback or score`)
    throw error
  }
}
// END SUBMIT CHALLENGE HELPERS


export const submitAnswer = async (
  logger: IMastraLogger,
  challenge: Question,
  userAnswer: string,
  level: LevelType | undefined,
  user: string,
  sessionId?: string,
  sessionToken?: string
) => {
  logger.info(`Session Token ${sessionToken}`)
  try {
    const userId = resolveSessionIdFromToken(process.env.HASH_SECRET!, user) ?? ''

    const { question, topic, initialCode, type } = challenge

    const feedback = await generateReply(level, { question, topic, initialCode, type }, userAnswer)

    const session = await findSession(logger, sessionToken ?? '')

    logger.info(`Session ID ${JSON.stringify(session)} or ${sessionId}`)
    
    await storeFeedback(logger, session?.id || sessionId || '', challenge, userAnswer, level, feedback, userId)
    
    return {
      ...feedback,
      sessionToken: session?.sessionToken,
    }
  } catch (error) {
    logger.error(JSON.stringify(error))
    throw error
  }

}
