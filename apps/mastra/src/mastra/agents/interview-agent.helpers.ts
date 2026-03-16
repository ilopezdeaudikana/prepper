import { interviewAgent } from "./interview-agent"
import { listReusableQuestions } from "../storage/interview-session.repository"

const MAX_REQUESTS_PER_MINUTE = 5
const MIN_GENERATE_INTERVAL_MS = Math.ceil(60_000 / MAX_REQUESTS_PER_MINUTE)

let lastGenerateRequestAt = 0
let generateQueue: Promise<unknown> = Promise.resolve()

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))

const clearQueueError = () => undefined

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

const waitForGenerateSlot = async () => {
  const now = Date.now()
  const waitTime = Math.max(0, lastGenerateRequestAt + MIN_GENERATE_INTERVAL_MS - now)
  if (waitTime > 0) {
    await sleep(waitTime)
  }

  lastGenerateRequestAt = Date.now()
}

export const dedupeQuestions = (questions: string[]) => Array.from(new Set(questions))

export const isTooSimilar = (candidate: string, previousQuestions: string[]) =>
  previousQuestions.some((previousQuestion) => jaccardSimilarity(candidate, previousQuestion) >= 0.55)

export const generateWithRateLimit = (...args: Parameters<typeof interviewAgent.generate>) => {
  const scheduled = generateQueue
    .catch(clearQueueError)
    .then(waitForGenerateSlot)
    .then(() => interviewAgent.generate(...args))

  generateQueue = scheduled.then(clearQueueError, clearQueueError)
  return scheduled
}

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

  const notCompleted = reusableQuestions.filter(
    (question) => !question.completed
  )
  const target = notCompleted.length ? notCompleted : reusableQuestions
  return target.find(
    (question) =>
      !previousQuestions.includes(question.question) &&
      !isTooSimilar(question.question, previousQuestions)
  )
}
