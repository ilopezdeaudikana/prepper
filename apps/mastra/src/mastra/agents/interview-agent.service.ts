import { type Question, QuestionSchema, FeedbackSchema } from "@repo/shared-types"
import {
  createFeedback,
  createSession,
  getSession,
  listQuestionTexts,
  upsertQuestion,
} from "../storage/interview-session.repository"
import {
  dedupeQuestions,
  findReusableQuestion,
  generateWithRateLimit,
  isTooSimilar,
} from "./interview-agent.helpers"

const isUuid = (value: string) =>
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value)

const formatReusableQuestion = async (
  sessionId: string,
  sessionToken: string,
  reusableQuestion: Question
) => {
  await upsertQuestion(sessionId, reusableQuestion)
  return {
    question: reusableQuestion.question,
    initialCode: reusableQuestion.initialCode,
    type: reusableQuestion.type,
    sessionToken,
  }
}

export const getChallenge = async (
  topic: string,
  level: string,
  previousQuestions: string[] = [],
  sessionToken?: string,
  options?: { skipReuse?: boolean, forceReuse?: boolean }
) => {
  const {forceReuse, skipReuse } = options ?? {}

  if (forceReuse && skipReuse) {
    throw new Error("Invalid options: forceReuse cannot be combined with skipReuse")
  }

  const legacySessionId = sessionToken && isUuid(sessionToken) ? sessionToken : undefined
  const existingSession = legacySessionId
    ? await getSession(legacySessionId)
    : null

  if (legacySessionId && !existingSession) {
    throw new Error(`Interview session not found: ${legacySessionId}`)
  }

  const session = existingSession ?? await createSession(topic, level)
  const persistedQuestions = await listQuestionTexts(session.id)
  const allPreviousQuestions = dedupeQuestions([...persistedQuestions, ...previousQuestions])

  if (!skipReuse) {
    const reusableQuestion = await findReusableQuestion({
      topic,
      level,
      excludeSessionToken: sessionToken ?? session.sessionToken,
      previousQuestions: allPreviousQuestions,
    })

    if (reusableQuestion) {
      return formatReusableQuestion(session.id, session.sessionToken, reusableQuestion)
    }
  }

  if (forceReuse) {
    // Force reuse path: ignore session boundaries and only avoid repeating the immediately previous challenge.
    const latestQuestion = previousQuestions.at(-1) ?? persistedQuestions.at(-1)
    const fallbackReusable = await findReusableQuestion({
      topic,
      level,
      previousQuestions: latestQuestion ? [latestQuestion] : [],
    })

    if (fallbackReusable) {
      return formatReusableQuestion(session.id, session.sessionToken, fallbackReusable)
    }

    throw new Error(`No reusable challenge found for topic "${topic}" at level "${level}"`)
  }

  const variationToken = `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`

  const exclusions = allPreviousQuestions.length
    ? allPreviousQuestions.map((question, index) => `${index + 1}. ${question}`).join("\n")
    : "None"

  let lastGenerated: Question | null = null

  for (let attempt = 1; attempt <= 4; attempt += 1) {
    const generationResponse = await generateWithRateLimit(
      `Generate one ${level}-level frontend interview challenge about ${topic}.
      Requirements:
      - Return exactly one challenge.
      - The challenge must be meaningfully different from previous ones.
      - Avoid repeating the same underlying task (e.g., counters, toggles, CRUD list variants).
      - Vary both the subtopic and the format (debugging, refactor, feature extension, architecture decision).
      - Use challenge-planning-tool to diversify subtopic/format before finalizing.
      - If sessionId exists, use session-question-history-tool to double-check uniqueness against persisted history.
      - Variation token: ${variationToken}-attempt-${attempt}.
      - Current session id: ${session.id}.

      Previously asked questions to avoid (do not paraphrase these):
      ${exclusions}`,
      {
        structuredOutput: {
          schema: QuestionSchema,
        jsonPromptInjection: true,
      },
    }
  )
    const generatedQuestion = generationResponse.object
    if (!generatedQuestion) {
      const rawText = generationResponse.text ?? ""
      console.error('INTERVIEW_AGENT: missing structured output for challenge', {
        topic,
        level,
        attempt,
        hasText: Boolean(generationResponse.text),
        textPreview: rawText.slice(0, 2000),
      })
      throw new Error('Challenge generation returned no structured output')
    }

    const parsed = QuestionSchema.safeParse(generatedQuestion)
    if (!parsed.success) {
      continue
    }

    lastGenerated = parsed.data

    console.log(lastGenerated)

    if (!isTooSimilar(parsed.data?.question, allPreviousQuestions)) {
      await upsertQuestion(session.id, parsed.data)
      return {
        ...parsed.data,
        sessionToken: session.sessionToken,
      }
    }
  }

  if (!lastGenerated) {
    throw new Error("Failed to generate challenge")
  }

  await upsertQuestion(session.id, lastGenerated)
  return {
    ...lastGenerated,
    sessionToken: session.sessionToken,
  }
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
      await getChallenge(job.topic, job.level, [], undefined, { skipReuse: true })
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
    const rawText = generationResponse.text ?? ""
    console.error('INTERVIEW_AGENT: missing structured output for evaluation', {
      level,
      hasText: Boolean(generationResponse.text),
      textPreview: rawText.slice(0, 2000),
    })
    throw new Error('Evaluation generation returned no structured output')
  }
  const parsedFeedback = FeedbackSchema.safeParse(generationResponse.object)
  if (!parsedFeedback.success) {
    throw new Error("Failed to generate feedback")
  }
  const generatedFeedback = parsedFeedback.data

  const legacySessionId = sessionToken && isUuid(sessionToken) ? sessionToken : undefined
  if (!legacySessionId) {
    return {
      ...generatedFeedback,
      sessionToken,
    }
  }

  const session = await getSession(legacySessionId)
  if (!session) {
    throw new Error(`Interview session not found: ${legacySessionId}`)
  }

  const questionId = await upsertQuestion(legacySessionId, question)
  await createFeedback({
    sessionId: legacySessionId,
    questionId,
    answer: userAnswer,
    level,
    feedback: generatedFeedback,
  })

  return {
    ...generatedFeedback,
    sessionToken: session.sessionToken,
  }
}
