import type { EvaluationResponse, Question } from "@repo/shared-types"
import * as sample from '../sample.json'
import * as responseSample from '../sample-response.json'
import { useConfiguration } from "@/store/configuration.store"

const MASTRA_API_URL = import.meta.env.VITE_MASTRA_API_URL

const getApiUrl = (path: string) => new URL(path, `${MASTRA_API_URL}`).toString()

export type ChallengeResponse = Question & { sessionToken?: string }

let hasThrown = false

const parseResponse = async <T>(response: Response, fallbackMessage: string): Promise<T> => {
  const body = await response.json().catch(() => null) as { error?: string } | null

  if (!response.ok) {
    const error = new Error(body?.error ?? fallbackMessage) as Error & { status?: number }
    error.status = response.status
    throw error
  }

  return body as T
}

export const ChallengeService = {
  async getChallenge(options: {topic: string, level: string}, previousQuestions: string[] = [], sessionToken?: string) {
    if (process.env.NODE_ENV === 'development') {
      if(!hasThrown){
        hasThrown = !hasThrown
        return Promise.reject(new Error('Simulated error in development mode'))
      } else { 
        return Promise.resolve(sample as ChallengeResponse)
      }
    }
    
    const { storageMode } = useConfiguration.getState().configuration
    
    const {topic, level} = options

    const response = await fetch(getApiUrl('interview/challenge'), {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ topic, level, previousQuestions, sessionToken, options: { forceReuse: storageMode }}),
    })
    return parseResponse<ChallengeResponse>(response, 'Challenge generation failed.')
  },

  async submitAnswer(question: Question, answer: string, level: string, sessionToken?: string) {
    if (process.env.NODE_ENV === 'development') {
      return Promise.resolve(responseSample as EvaluationResponse)
    }
    const response = await fetch(getApiUrl('interview/evaluate'), {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ question, answer, level, sessionToken }),
    })
    return parseResponse<EvaluationResponse>(response, 'Evaluation failed.')
  }
}
