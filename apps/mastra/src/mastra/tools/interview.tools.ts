import { createTool } from '@mastra/core/tools'
import { z } from 'zod'
import { interviewSessionRepository } from '../storage/interview-session.repository'

const levelGuide: Record<string, { focus: string[]; avoid: string[] }> = {
  junior: {
    focus: ['Syntax correctness', 'Basic logic', 'Following instructions'],
    avoid: ['Complex architecture requirements', 'Overly broad prompts'],
  },
  mid: {
    focus: ['Readability', 'Performance tradeoffs', 'Best practices'],
    avoid: ['Toy-only examples', 'Unbounded scope'],
  },
  senior: {
    focus: ['Architecture choices', 'Edge cases', 'Accessibility and scalability'],
    avoid: ['Pure syntax tests', 'Single-happy-path prompts'],
  },
}

const challengeFormats = ['debugging', 'refactor', 'feature extension', 'architecture decision']

const topicExpansions: Record<string, string[]> = {
  react: ['state management', 'render performance', 'hooks', 'accessibility'],
  typescript: ['type narrowing', 'generic APIs', 'utility types', 'runtime validation boundaries'],
  javascript: ['async control flow', 'closures', 'event loop', 'data transformations'],
  css: ['layout systems', 'responsive strategy', 'design tokens', 'animation performance'],
}

const normalizeLevel = (level: string) => level.trim().toLowerCase()
const normalizeTopic = (topic: string) => topic.trim().toLowerCase()

export const sessionQuestionHistoryTool = createTool({
  id: 'session-question-history-tool',
  description: 'Fetches previously asked interview questions for a session to avoid repetitions.',
  inputSchema: z.object({
    sessionId: z.string().uuid(),
  }),
  outputSchema: z.object({
    questions: z.array(z.string()),
    total: z.number(),
  }),
  execute: async ({ sessionId }) => {
    const questions = await interviewSessionRepository.listQuestionTexts(sessionId)
    return {
      questions,
      total: questions.length,
    }
  },
})

export const challengePlanningTool = createTool({
  id: 'challenge-planning-tool',
  description: 'Provides candidate subtopics and challenge formats for a topic and level.',
  inputSchema: z.object({
    topic: z.string().min(1),
    level: z.string().min(1),
  }),
  outputSchema: z.object({
    suggestedSubtopics: z.array(z.string()),
    suggestedFormats: z.array(z.string()),
    levelFocus: z.array(z.string()),
  }),
  execute: async ({ topic, level }) => {
    const normalizedTopic = normalizeTopic(topic)
    const normalizedLevel = normalizeLevel(level)

    const suggestedSubtopics =
      topicExpansions[normalizedTopic] ?? [
        `${topic} fundamentals`,
        `${topic} performance`,
        `${topic} maintainability`,
      ]

    const levelFocus = levelGuide[normalizedLevel]?.focus ?? ['Clarity', 'Correctness', 'Pragmatism']

    return {
      suggestedSubtopics,
      suggestedFormats: challengeFormats,
      levelFocus,
    }
  },
})

export const rubricGuidanceTool = createTool({
  id: 'rubric-guidance-tool',
  description: 'Returns deterministic scoring checks and common misses for interview evaluation by level.',
  inputSchema: z.object({
    level: z.string().min(1),
    questionType: z.enum(['coding', 'theoretical']),
  }),
  outputSchema: z.object({
    mustCheck: z.array(z.string()),
    commonMisses: z.array(z.string()),
  }),
  execute: async ({ level, questionType }) => {
    const normalizedLevel = normalizeLevel(level)
    const levelConfig = levelGuide[normalizedLevel] ?? {
      focus: ['Correctness', 'Communication', 'Tradeoffs'],
      avoid: ['Purely subjective scoring'],
    }

    const mustCheck = questionType === 'coding'
      ? [...levelConfig.focus, 'Code correctness', 'Edge-case handling']
      : [...levelConfig.focus, 'Reasoning depth', 'Tradeoff discussion']

    return {
      mustCheck,
      commonMisses: levelConfig.avoid,
    }
  },
})
