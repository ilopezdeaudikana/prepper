import { interviewAgent } from "./interview-agent"
import { type Feedback, type Question, QuestionSchema, FeedbackSchema } from "@repo/shared-types"
import { interviewSessionRepository } from "../storage/interview-session.repository"

const normalize = (text: string) =>
  text
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim()

const tokenSet = (text: string) => new Set(normalize(text).split(" ").filter(Boolean))

const jaccardSimilarity = (a: string, b: string) => {
  const aTokens = tokenSet(a)
  const bTokens = tokenSet(b)

  if (aTokens.size === 0 || bTokens.size === 0) return 0

  let intersection = 0
  for (const token of aTokens) {
    if (bTokens.has(token)) intersection += 1
  }

  const union = new Set([...aTokens, ...bTokens]).size
  return union === 0 ? 0 : intersection / union
}

const isTooSimilar = (candidate: string, previousQuestions: string[]) =>
  previousQuestions.some((prev) => jaccardSimilarity(candidate, prev) >= 0.55)

const dedupeQuestions = (questions: string[]) => Array.from(new Set(questions))

export const getChallenge = async (
  topic: string,
  level: string,
  previousQuestions: string[] = [],
  sessionId?: string
) => {
  const existingSession = sessionId
    ? await interviewSessionRepository.getSession(sessionId)
    : null

  if (sessionId && !existingSession) {
    throw new Error(`Interview session not found: ${sessionId}`)
  }

  const session = existingSession ?? await interviewSessionRepository.createSession(topic, level)
  const persistedQuestions = await interviewSessionRepository.listQuestionTexts(session.id)
  const allPreviousQuestions = dedupeQuestions([...persistedQuestions, ...previousQuestions])

  const variationToken = `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`

  const exclusions = allPreviousQuestions.length
    ? allPreviousQuestions.map((question, index) => `${index + 1}. ${question}`).join("\n")
    : "None"

  let lastGenerated: Question | null = null

  for (let attempt = 1; attempt <= 4; attempt += 1) {
    const { object } = await interviewAgent.generate(
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

    const parsed = QuestionSchema.safeParse(object)
    if (!parsed.success) {
      continue
    }

    lastGenerated = parsed.data
    console.log(lastGenerated)
    if (!isTooSimilar(parsed.data?.question, allPreviousQuestions)) {
      await interviewSessionRepository.upsertQuestion(session.id, parsed.data)
      return {
        ...parsed.data,
        sessionId: session.id,
      }
    }
  }

  if (!lastGenerated) {
    throw new Error("Failed to generate challenge")
  }

  await interviewSessionRepository.upsertQuestion(session.id, lastGenerated)
  return {
    ...lastGenerated,
    sessionId: session.id,
  }
}

export const submitAnswer = async (
  question: Question,
  userAnswer: string,
  level: string,
  sessionId?: string
) => {
  const { object } = await interviewAgent.generate(
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

  if (!sessionId) {
    return object
  }

  const session = await interviewSessionRepository.getSession(sessionId)
  if (!session) {
    throw new Error(`Interview session not found: ${sessionId}`)
  }

  const questionId = await interviewSessionRepository.upsertQuestion(sessionId, question)
  await interviewSessionRepository.createFeedback({
    sessionId,
    questionId,
    answer: userAnswer,
    level,
    feedback: object as Feedback,
  })

  return {
    ...object,
    sessionId,
  }
}
