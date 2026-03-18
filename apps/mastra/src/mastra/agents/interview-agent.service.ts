import { type Question, QuestionSchema, FeedbackSchema, ChallengeType, MINIMUM_SCORE } from '@repo/shared-types'
import {
  createFeedback,
  createSession,
  getSession,
  listQuestionTexts,
  upsertQuestion,
  completeQuestion
} from '../storage/interview-session.repository'
import {
  dedupeQuestions,
  findReusableQuestion,
  generateWithRateLimit,
  isTooSimilar,
} from './interview-agent.helpers'
import { ILogger } from '../logger.service'
import { resolveSessionIdFromToken } from '../storage/utils'

const formatReusableQuestion = async (
  sessionId: string,
  sessionToken: string,
  reusableQuestion: Question
) => {
  await upsertQuestion(sessionId, reusableQuestion)
  return {
    id: reusableQuestion.id,
    question: reusableQuestion.question,
    initialCode: reusableQuestion.initialCode,
    type: reusableQuestion.type,
    sessionToken,
  }
}

type ChallengeOptions = { skipReuse?: boolean, forceReuse?: boolean }

type ChallengeSessionContext = {
  session: Awaited<ReturnType<typeof createSession>>
  persistedQuestions: string[]
  allPreviousQuestions: string[]
}

const validateChallengeOptions = (options?: ChallengeOptions) => {
  const { forceReuse, skipReuse } = options ?? {}

  if (forceReuse && skipReuse) {
    throw new Error('Invalid options: forceReuse cannot be combined with skipReuse')
  }

  return { forceReuse, skipReuse }
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

const formatQuestionExclusions = (questions: string[]) =>
  questions.length
    ? questions.map((question, index) => `${index + 1}. ${question}`).join('\n')
    : 'None'

const buildChallengePrompt = (params: {
  topic: string
  level: string
  variationToken: string
  attempt: number
  sessionId: string
  exclusions: string
}) => {
  const { topic, level, variationToken, attempt, sessionId, exclusions } = params

  return `Generate one ${level}-level frontend interview challenge about ${topic}.
      Requirements:
      - Return exactly one challenge.
      - The challenge must be meaningfully different from previous ones.
      - Avoid repeating the same underlying task (e.g., counters, toggles, CRUD list variants).
      - Vary both the subtopic and the format (debugging, refactor, feature extension, architecture decision).
      - Use challenge-planning-tool to diversify subtopic/format before finalizing.
      - If sessionId exists, use session-question-history-tool to double-check uniqueness against persisted history.
      - Variation token: ${variationToken}-attempt-${attempt}.
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

  for (let i = 1; i <= 4; i++) {
    const generationResponse = await generateWithRateLimit(
      buildChallengePrompt({
        topic,
        level,
        variationToken,
        attempt: i,
        sessionId,
        exclusions,
      }),
      {
        structuredOutput: {
          schema: QuestionSchema,
          jsonPromptInjection: true,
        },
      }
    )
    const generatedQuestion = generationResponse.object
    if (!generatedQuestion) {
      const rawText = generationResponse.text ?? ''
      logger?.error('INTERVIEW_AGENT: missing structured output for challenge', {
        topic,
        level,
        i,
        hasText: Boolean(generationResponse.text),
        textPreview: rawText.slice(0, 2000),
      })
      throw new Error('Challenge generation returned no structured output')
    }

    const parsed = QuestionSchema.safeParse(normalizeGeneratedQuestion(generatedQuestion))
    if (!parsed.success) {
      continue
    }

    lastGenerated = parsed.data

    logger?.info('', JSON.stringify(lastGenerated))

    if (!isTooSimilar(parsed.data.question, allPreviousQuestions)) {
      await upsertQuestion(sessionId, parsed.data)
      return {
        ...parsed.data,
        sessionToken,
      }
    }
  }

  if (!lastGenerated) {
    throw new Error('Failed to generate challenge')
  }

  await upsertQuestion(sessionId, lastGenerated)
  return {
    ...lastGenerated,
    sessionToken,
  }
}

export const getChallenge = async (
  topic: string,
  level: string,
  previousQuestions: string[] = [],
  logger: ILogger | undefined,
  sessionToken?: string,
  options?: ChallengeOptions,
) => {
  const { forceReuse, skipReuse } = validateChallengeOptions(options)
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

export const prefillChallengePool = async (params: {
  topics: string[]
  levels: string[]
  countPerPair: number
}) => {
  const { topics, levels, countPerPair } = params
  const jobs = topics
    .flatMap((topic) => levels.map((level) => ({ topic, level })))
    .flatMap((job) => Array.from({ length: countPerPair }, () => job))

  let generated = 0
  const failures: { topic: string; level: string; message: string }[] = []

  for (const job of jobs) {
    try {
      await getChallenge(job.topic, job.level, [], undefined, undefined, { skipReuse: true })
      generated += 1
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown prefill error'
      failures.push({
        topic: job.topic,
        level: job.level,
        message,
      })
    }
  }

  return {
    requested: jobs.length,
    generated,
    failed: failures.length,
    failures,
  }
}

export const submitAnswer = async (
  question: Question,
  userAnswer: string,
  level: string,
  logger: ILogger,
  sessionToken?: string
) => {

  const generationResponse = await generateWithRateLimit(
    `Level: ${level}
     Question: ${JSON.stringify(question)}
     User Answer: ${userAnswer}

     Evaluate based on the rubric.
     Use rubric-guidance-tool to build deterministic must-check criteria before scoring.`,
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
  const parsedFeedback = FeedbackSchema.safeParse(generationResponse.object)
  if (!parsedFeedback.success) {
    throw new Error('Failed to generate feedback')
  }
  const generatedFeedback = parsedFeedback.data

  const sessionId = resolveSessionIdFromToken(process.env.HASH_SECRET!, sessionToken)
  if (!sessionId) {
    return {
      ...generatedFeedback,
      sessionToken,
    }
  }

  const session = await getSession(sessionId)
  if (!session) {
    throw new Error(`Interview session not found: ${sessionId}`)
  }

  const questionId = await upsertQuestion(sessionId, question)
  await createFeedback({
    sessionId: sessionId,
    questionId,
    answer: userAnswer,
    level,
    feedback: generatedFeedback,
  })

  logger.info(`Score ${generatedFeedback.score} for questionId ${questionId}`)

  if (generatedFeedback.score > MINIMUM_SCORE) {
    try {
      await completeQuestion(questionId)
    } catch (error) {
      logger.error(`Error completing challenge ${JSON.stringify(error)}`)
    }
  }
  return {
    ...generatedFeedback,
    sessionToken: session.sessionToken,
  }
}
