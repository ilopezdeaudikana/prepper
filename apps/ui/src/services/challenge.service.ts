import type { ChallengeType, EvaluationResponse, Feedback, Filters, HintResponse, LevelType, Question } from "@repo/shared-types"
import { useConfiguration } from "@/store/configuration.store"
import { parseResponse } from "@/common/utils/parse-api-response"
import { useUser } from "@/store/user.store"

const MASTRA_API_URL = import.meta.env.VITE_MASTRA_API_URL

const getApiUrl = (path: string) => new URL(path, `${MASTRA_API_URL}`).toString()

export type ChallengeResponse = Question & { sessionToken?: string, notice?: string }


export const ChallengeService = {
  async createChallenge(options: { topic: string, level?: LevelType, type: ChallengeType }, previousQuestions: string[] = [], sessionToken?: string) {

    const { storageMode } = useConfiguration.getState().configuration

    const { user } = useUser.getState()

    const { topic, level, type } = options

    const response = await fetch(getApiUrl('interview/challenge'), {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ topic, level, type, previousQuestions, sessionToken, user, options: { forceReuse: storageMode } }),
    })
    return parseResponse<ChallengeResponse>(response, 'Challenge generation failed.')
  },

  async getChallenges(start: string, filters?: Filters) {

    const { type, topic, completed, level } = filters ?? {}

    const { user } = useUser.getState()
    const url = new URL(getApiUrl('interview/all-challenges'))
    url.searchParams.append('start', start ?? '0')
    if (completed) url.searchParams.append('completed', completed)
    if (topic) url.searchParams.append('topic', topic)
    if (type) url.searchParams.append('type', type)
    if (level) url.searchParams.append('level', level)
    url.searchParams.append('user', user)

    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      }
    })

    return parseResponse<{ data: (Question & Feedback)[], count: number }>(response, 'Challenge retrieval failed.')

  },

    async getChallengeWithId(id: string) {

    const url = new URL(getApiUrl(`interview/challenge/${id}`))

    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      }
    })

    return parseResponse<{ data: Question & Feedback }>(response, 'Challenge retrieval failed.')

  },

  async submitAnswer(question: Question, answer: string, level?: LevelType, sessionId?: string, sessionToken?: string) {
    const { user } = useUser.getState()

    const response = await fetch(getApiUrl('interview/evaluate'), {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ question: { ...question, user }, answer, level, sessionToken, sessionId }),
    })
    return parseResponse<EvaluationResponse>(response, 'Evaluation failed.')
  },

  async getHint(question: Question, answer: string, level?: LevelType) {

    const response = await fetch(getApiUrl('interview/hint'), {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ question: { ...question }, answer, level }),
    })
    return parseResponse<HintResponse>(response, 'Hint generation failed.')
  }
}
