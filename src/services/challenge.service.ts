import type { Question } from "@/mastra/agents/interview-agent"
import * as sample from '../sample.json'
import * as responseSample from '../sample-response.json'

const MASTRA_API_PROTOCOL = import.meta.env.VITE_MASTRA_API_PROTOCOL
const MASTRA_API_HOST = import.meta.env.VITE_MASTRA_API_HOST 
const MASTRA_API_PORT = import.meta.env.VITE_MASTRA_API_PORT 
const MASTRA_API_BASE_URL = `${MASTRA_API_PROTOCOL}://${MASTRA_API_HOST}:${MASTRA_API_PORT}`

const getApiUrl = (path: string) => new URL(path, `${MASTRA_API_BASE_URL}/`).toString()

export const ChallengeService = {
  async getChallenge(topic: string, level: string, previousQuestions: string[] = []) {
    if (process.env.NODE_ENV === 'development') {
      return Promise.resolve(sample)
    }
    const response = await fetch(getApiUrl('/interview/challenge'), {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ topic, level, previousQuestions }),
    })
    return response.json()
  },

  async submitAnswer(question: Question, answer: string, level: string) {
    if (process.env.NODE_ENV === 'development') {
      return Promise.resolve(responseSample)
    }
    const response = await fetch(getApiUrl('/interview/evaluate'), {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ question, answer, level }),
    })
    return response.json()
  }
}
