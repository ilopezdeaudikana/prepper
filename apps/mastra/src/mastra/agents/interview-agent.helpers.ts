import { listReusableQuestions } from "../storage/interview-session.repository"

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


export const dedupeQuestions = (questions: string[]) => Array.from(new Set(questions))

export const isTooSimilar = (candidate: string, previousQuestions: string[]) =>
  previousQuestions.some((previousQuestion) => jaccardSimilarity(candidate, previousQuestion) >= 0.55)

export const findReusableQuestion = async (params: {
  topic: string
  level: string
  excludeSessionToken?: string
  previousQuestions: string[]
}) => {
  const { topic, level, excludeSessionToken, previousQuestions } = params
  const reusableQuestions = await listReusableQuestions({
    topic,
    level,
    excludeSessionToken,
    limit: 30,
  })

  const question = reusableQuestions.find(
    (question) =>
      !previousQuestions.includes(question.question) &&
      !isTooSimilar(question.question, previousQuestions)
  )

  return question ? { ...question, topic, level } : undefined
}
