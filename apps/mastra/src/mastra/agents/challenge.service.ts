import { type Question, QuestionSchema, ChallengeType, Level, LevelType, RANDOM } from '@repo/shared-types'
import {
  createSession,
  getSession,
  listReusableQuestions,
  listQuestionTexts,
  upsertQuestion
} from '../storage/interview-session.repository'
import {
  dedupeQuestions,
  findReusableQuestion,
  isTooSimilar,
} from './interview-agent.helpers'
import { resolveSessionIdFromToken } from '../storage/utils'
import { interviewAgent } from "./interview-agent"

type ChallengeOptions = { skipReuse?: boolean, forceReuse?: boolean }

type ChallengeSessionContext = {
  session: Awaited<ReturnType<typeof createSession>>
  persistedQuestions: string[]
  allPreviousQuestions: string[]
}

// GET CHALLENGE HELPERS
const formatReusableQuestion = async (
  sessionToken: string,
  reusableQuestion: Question,
  notice?: string,
) => {
  if (!reusableQuestion.id) {
    throw new Error('Reusable challenge is missing a persisted question id')
  }

  return {
    id: reusableQuestion.id,
    question: reusableQuestion.question,
    initialCode: reusableQuestion.initialCode,
    type: reusableQuestion.type,
    sessionToken,
    topic: reusableQuestion.topic, level: reusableQuestion.level,
    notice,
    user: reusableQuestion.user,
  }
}

const resolveChallengeSession = async (
  topic: string,
  level: LevelType | undefined,
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

  return formatReusableQuestion(sessionToken, reusableQuestion)
}

const forceReuseChallenge = async (params: {
  topic: string
  level: LevelType,
  type: ChallengeType,
  sessionToken: string
  previousQuestions: string[]
  persistedQuestions: string[]
  user: string
}) => {
  const { topic, level, type, sessionToken, previousQuestions, persistedQuestions, user } = params
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

  return formatReusableQuestion(sessionToken, fallbackReusable)
}

const getRandomStoredChallenge = async (params: {
  sessionToken: string
  type: ChallengeType | undefined
  previousQuestions: string[]
  notice: string
  user: string
}) => {
  const { sessionToken, type, previousQuestions, notice, user } = params
  const reusableQuestions = await listReusableQuestions({
    user,
    type,
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

  return formatReusableQuestion(sessionToken, randomQuestion, notice)
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
  const typeInstruction = type && type !== ChallengeType.Mixed
    ? `- The returned JSON "type" must be "${type}".`
    : `- Choose exactly one returned JSON "type": "${ChallengeType.Coding}" or "${ChallengeType.Theoretical}".`

  return `Generate one ${level}-level frontend interview challenge about ${topic} of ${finalType} type.
      Requirements:
      - Return exactly one challenge.
      ${typeInstruction}
      - For theoretical challenges, ask a conceptual/tradeoff question and omit "initialCode".
      - For coding challenges, include starter "initialCode".
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
  level: LevelType
  type: ChallengeType
  sessionId: string
  sessionToken: string
  allPreviousQuestions: string[]
  user: string
}) => {
  const { topic, level, type, sessionId, sessionToken, allPreviousQuestions, user } = params
  const variationToken = `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`
  const exclusions = formatQuestionExclusions(allPreviousQuestions)
  let lastGenerated: Question | null = null

  const generationResponse = await interviewAgent.generate(buildChallengePrompt({
    topic,
    level,
    type,
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


  const generatedQuestion = {
    ...generationResponse.object,
    topic,
    level,
    type: type === ChallengeType.Mixed ? generationResponse.object?.type : type,
    user,
  }
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

  if (lastGenerated) {
    if (!isTooSimilar(lastGenerated.question, allPreviousQuestions)) {
      const questionId = await upsertQuestion(sessionId, lastGenerated, user)
      return {
        ...lastGenerated,
        id: questionId,
        sessionToken,
      }
    }

    return getRandomStoredChallenge({
      sessionToken,
      type,
      previousQuestions: allPreviousQuestions,
      notice: 'We skipped a too-similar generated question and loaded a random stored challenge instead.',
      user
    })
  }

  throw new Error('Challenge generation did not produce a usable question')
}

// END GET CHALLENGE HELPERS

export const getChallenge = async (
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
  const effectiveLevel = level ?? Level.Mid
  const effectiveType = type ?? ChallengeType.Mixed

  const { session, persistedQuestions, allPreviousQuestions } = await resolveChallengeSession(
    topic,
    effectiveLevel,
    previousQuestions,
    sessionToken,
  )

  const reusedChallenge = await tryReuseChallenge({
    topic,
    level: effectiveLevel,
    type: effectiveType,
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
      level: effectiveLevel,
      type: effectiveType,
      sessionToken: session.sessionToken,
      previousQuestions,
      persistedQuestions,
      user: userId
    })
  }

  return generateFreshChallenge({
    topic,
    level: effectiveLevel,
    type: effectiveType,
    sessionId: session.id,
    sessionToken: session.sessionToken,
    allPreviousQuestions,
    user: userId
  })
}
