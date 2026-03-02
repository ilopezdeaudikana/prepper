import type { EvaluateAnswerResponse, Question } from "@repo/shared-types"
import * as sample from '../sample.json'
import * as responseSample from '../sample-response.json'

const MASTRA_API_URL = import.meta.env.VITE_MASTRA_API_URL

const getApiUrl = (path: string) => new URL(path, `${MASTRA_API_URL}`).toString()

export type ChallengeResponse = Question & { sessionId?: string }

export const ChallengeService = {
  async getChallenge(topic: string, level: string, previousQuestions: string[] = [], sessionId?: string) {
    if (process.env.NODE_ENV === 'development') {
      return Promise.resolve(sample as ChallengeResponse)
    }
    const response = await fetch(getApiUrl('interview/challenge'), {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ topic, level, previousQuestions, sessionId }),
    })
    return response.json() as Promise<ChallengeResponse>
  },

  async submitAnswer(question: Question, answer: string, level: string, sessionId?: string) {
    if (process.env.NODE_ENV === 'development') {
      return Promise.resolve(responseSample as EvaluateAnswerResponse)
    }
    const response = await fetch(getApiUrl('interview/evaluate'), {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ question, answer, level, sessionId }),
    })
    return response.json() as Promise<EvaluateAnswerResponse>
  }
}
