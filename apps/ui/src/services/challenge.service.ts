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

    const { session } = useUser.getState()

    const { topic, level, type } = options

    const response = await fetch(getApiUrl('challenge'), {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ topic, level, type, previousQuestions, sessionToken, user: session, options: { forceReuse: storageMode } }),
    })
    return parseResponse<ChallengeResponse>(response, 'Challenge generation failed.')
  },

  async getChallenges(start: string, filters?: Filters) {

    const { type, topic, completed, level } = filters ?? {}

    const { session } = useUser.getState() || localStorage.getItem('prepper-session')
    
    if (!session) return Promise.resolve({ data:[], count: 0 })
      
    const url = new URL(getApiUrl('challenge'))
    url.searchParams.append('start', start ?? '0')
    if (completed) url.searchParams.append('completed', completed)
    if (topic) url.searchParams.append('topic', topic)
    if (type) url.searchParams.append('type', type)
    if (level) url.searchParams.append('level', level)
    url.searchParams.append('user', session)

    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      }
    })

    return parseResponse<{ data: (Question & Feedback)[], count: number }>(response, 'Challenge retrieval failed.')

  },

    async getChallengeWithId(id: string) {

    const url = new URL(getApiUrl(`challenge/${id}`))

    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      }
    })

    return parseResponse<{ data: Question & Feedback }>(response, 'Challenge retrieval failed.')

  },

  async submitAnswer(question: Question, answer: string, level?: LevelType, sessionToken?: string) {
    const { session } = useUser.getState()

    const response = await fetch(getApiUrl('challenge/evaluate'), {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ question: { ...question, user: session }, answer, level, sessionToken }),
    })
    return parseResponse<EvaluationResponse>(response, 'Evaluation failed.')
  },

  async deleteQuestion(id: string) {

    const response = await fetch(getApiUrl('challenge'), {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ id }),
    })
    return parseResponse<{ message: string }>(response, 'Evaluation failed.')
  },

  async getHint(question: Question, answer: string, level?: LevelType) {

    const response = await fetch(getApiUrl('challenge/hint'), {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ question: { ...question }, answer, level }),
    })
    return parseResponse<HintResponse>(response, 'Hint generation failed.')
  }
}
