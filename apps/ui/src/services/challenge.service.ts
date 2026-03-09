import type { EvaluationResponse, Question } from "@repo/shared-types"
import * as sample from '../sample.json'
import * as responseSample from '../sample-response.json'
import { useConfiguration } from "@/store/configuration.store"

const MASTRA_API_URL = import.meta.env.VITE_MASTRA_API_URL

const getApiUrl = (path: string) => new URL(path, `${MASTRA_API_URL}`).toString()

export type ChallengeResponse = Question & { sessionId?: string }

export const ChallengeService = {
  async getChallenge(options: {topic: string, level: string}, previousQuestions: string[] = [], sessionId?: string) {
    if (process.env.NODE_ENV === 'development') {
      return Promise.resolve(sample as ChallengeResponse)
    }
    
    const { storageMode } = useConfiguration.getState().configuration
    
    const {topic, level} = options

    const response = await fetch(getApiUrl('interview/challenge'), {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ topic, level, previousQuestions, sessionId, options: { forceReuse: storageMode }}),
    })
    return response.json() as Promise<ChallengeResponse>
  },

  async submitAnswer(question: Question, answer: string, level: string, sessionId?: string) {
    if (process.env.NODE_ENV === 'development') {
      return Promise.resolve(responseSample as EvaluationResponse)
    }
    const response = await fetch(getApiUrl('interview/evaluate'), {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ question, answer, level, sessionId }),
    })
    return response.json() as Promise<EvaluationResponse>
  }
}
