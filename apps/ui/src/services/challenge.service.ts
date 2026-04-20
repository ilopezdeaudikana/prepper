import type { EvaluationResponse, Feedback, Question } from "@repo/shared-types"
// import * as sample from '../sample.json'
// import * as responseSample from '../sample-response.json'
import { useConfiguration } from "@/store/configuration.store"
import { parseResponse } from "@/common/utils/parse-api-response"
import { useUser } from "@/store/user.store"

const MASTRA_API_URL = import.meta.env.VITE_MASTRA_API_URL

const getApiUrl = (path: string) => new URL(path, `${MASTRA_API_URL}`).toString()

export type ChallengeResponse = Question & { sessionToken?: string, notice?: string }

// let hasThrown = false

export const ChallengeService = {
  async getChallenge(options: { topic: string, level: string }, previousQuestions: string[] = [], sessionToken?: string) {
    // if (process.env.NODE_ENV === 'development') {
    //   if (!hasThrown) {
    //     hasThrown = !hasThrown
    //     return Promise.reject(new Error('Simulated error in development mode'))
    //   } else {
    //     return Promise.resolve(sample as ChallengeResponse)
    //   }
    // }

    const { storageMode } = useConfiguration.getState().configuration

    const { user } = useUser.getState()

    const { topic, level } = options

    const response = await fetch(getApiUrl('interview/challenge'), {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ topic, level, previousQuestions, sessionToken, user, options: { forceReuse: storageMode } }),
    })
    return parseResponse<ChallengeResponse>(response, 'Challenge generation failed.')
  },

  async getChallenges(start: string, completed: string) {
    
    const { user } = useUser.getState()
    const url = new URL(getApiUrl('interview/all-challenges'))
    url.searchParams.append('start', start)
    url.searchParams.append('completed', completed)
    url.searchParams.append('user', user)

    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      }
    })
    
  return parseResponse<{ data: (Question & Feedback)[], count: number }>(response, 'Challenge retrieval failed.')

  },

  async submitAnswer(question: Question, answer: string, level: string, sessionId?: string, sessionToken?: string) {
    // if (process.env.NODE_ENV === 'development') {
    //   return Promise.resolve(responseSample as EvaluationResponse)
    // }
    const { user } = useUser.getState()

    const response = await fetch(getApiUrl('interview/evaluate'), {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ question: { ...question, user }, answer, level, sessionToken, sessionId }),
    })
    return parseResponse<EvaluationResponse>(response, 'Evaluation failed.')
  }
}
