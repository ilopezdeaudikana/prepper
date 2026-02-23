import type { Question } from "@/mastra/agents/interview-agent"

export const ChallengeService = {
  async getChallenge(topic: string, level: string) {
    const response = await fetch('http://localhost:4111/interview/challenge', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ topic, level }),
    })
    return response.json()
  },

  async submitAnswer(question: Question, answer: string, level: string) {
    const response = await fetch('http://localhost:4111/interview/evaluate', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ question, answer, level }),
    })
    return response.json()
  }
}