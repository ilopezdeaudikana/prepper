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

export const getChallenge = async (
  topic: string,
  level: string,
  previousQuestions: string[] = [],
  sessionId?: string,
  options?: { skipReuse?: boolean, forceReuse?: boolean }
) => {
  const {forceReuse, skipReuse } = options ?? {}

  if (forceReuse && skipReuse) {
    throw new Error("Invalid options: forceReuse cannot be combined with skipReuse")
  }

  const existingSession = sessionId
    ? await getSession(sessionId)
    : null

  if (sessionId && !existingSession) {
    throw new Error(`Interview session not found: ${sessionId}`)
  }

  const session = existingSession ?? await createSession(topic, level)
  const persistedQuestions = await listQuestionTexts(session.id)
  const allPreviousQuestions = dedupeQuestions([...persistedQuestions, ...previousQuestions])

  if (!skipReuse) {
    const reusableQuestion = await findReusableQuestion({
      topic,
      level,
      sessionId: session.id,
      previousQuestions: allPreviousQuestions,
    })

    if (reusableQuestion) {
      await upsertQuestion(session.id, reusableQuestion)
      return {
        question: reusableQuestion.question,
        initialCode: reusableQuestion.initialCode,
        type: reusableQuestion.type,
        sessionId: session.id,
      }
    }
  }

  if (forceReuse) {
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
      ${sessionId ? `- Current sessionId: ${sessionId}.` : ''}

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
        sessionId: session.id,
      }
    }
  }

  if (!lastGenerated) {
    throw new Error("Failed to generate challenge")
  }

  await upsertQuestion(session.id, lastGenerated)
  return {
    ...lastGenerated,
    sessionId: session.id,
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
  sessionId?: string
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
  const parsedFeedback = FeedbackSchema.safeParse(generationResponse.object)
  if (!parsedFeedback.success) {
    throw new Error("Failed to generate feedback")
  }
  const generatedFeedback = parsedFeedback.data

  if (!sessionId) {
    return generatedFeedback
  }

  const session = await getSession(sessionId)
  if (!session) {
    throw new Error(`Interview session not found: ${sessionId}`)
  }

  const questionId = await upsertQuestion(sessionId, question)
  await createFeedback({
    sessionId,
    questionId,
    answer: userAnswer,
    level,
    feedback: generatedFeedback,
  })

  return {
    ...generatedFeedback,
    sessionId,
  }
}
