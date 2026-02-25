// src/mastra/agents/interview-service.ts
import { interviewAgent, QuestionSchema, type Question, FeedbackSchema } from "./interview-agent"

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

export const getChallenge = async (topic: string, level: string, previousQuestions: string[] = []) => {
  const variationToken = `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`

  const exclusions = previousQuestions.length
    ? previousQuestions.map((question, index) => `${index + 1}. ${question}`).join("\n")
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
- Variation token: ${variationToken}-attempt-${attempt}.

Previously asked questions to avoid (do not paraphrase these):
${exclusions}`,
      { structuredOutput: { schema: QuestionSchema } }
    )

    lastGenerated = object
    if (!isTooSimilar(object.question, previousQuestions)) {
      return object
    }
  }

  return lastGenerated
}

export const submitAnswer = async (question: Question, userAnswer: string, level: string) => {
  const { object } = await interviewAgent.generate(
    `Level: ${level}
     Question: ${JSON.stringify(question)}
     User Answer: ${userAnswer}

     Evaluate based on the rubric.`,
    { structuredOutput: { schema: FeedbackSchema } }
  )
  return object
}
