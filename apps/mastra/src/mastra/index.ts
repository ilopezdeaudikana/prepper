
import { Mastra } from '@mastra/core/mastra'
import { PinoLogger } from '@mastra/loggers'
import { Observability, DefaultExporter, CloudExporter, SensitiveDataFilter } from '@mastra/observability'
import { interviewAgent } from './agents/interview-agent'
import { registerApiRoute } from '@mastra/core/server'
import { getChallenge, submitAnswer } from './agents/interview-agent.service'
import { VercelDeployer } from '@mastra/deployer-vercel'
import { ChallengeRequestSchema, EvaluateAnswerRequestSchema } from '@repo/shared-types'
import { ZodError } from 'zod'

export const mastra = new Mastra({
  agents: { interviewAgent },
  logger: new PinoLogger({
    name: 'Mastra',
    level: 'info',
  }),
  observability: new Observability({
    configs: {
      default: {
        serviceName: 'mastra',
        exporters: [
          new DefaultExporter(), // Persists traces to storage for Mastra Studio
          new CloudExporter(), // Sends traces to Mastra Cloud (if MASTRA_CLOUD_ACCESS_TOKEN is set)
        ],
        spanOutputProcessors: [
          new SensitiveDataFilter(), // Redacts sensitive data like passwords, tokens, keys
        ],
      },
    },
  }),
  server: {
    apiRoutes: [
      registerApiRoute("/interview/challenge", {
        method: "POST",
        handler: async (c) => {
          try {
            const payload = ChallengeRequestSchema.parse(await c.req.json())
            const result = await getChallenge(
              payload.topic,
              payload.level,
              payload.previousQuestions,
              payload.sessionId
            )
            return c.json(result)
          } catch (error) {
            const message = error instanceof Error ? error.message : 'Invalid challenge request'
            const status = error instanceof ZodError ? 400 : 500
            return c.json({ error: message }, status)
          }
        },
      }),
      registerApiRoute("/interview/evaluate", {
        method: "POST",
        handler: async (c) => {
          try {
            const payload = EvaluateAnswerRequestSchema.parse(await c.req.json())
            const result = await submitAnswer(
              payload.question,
              payload.answer,
              payload.level,
              payload.sessionId
            )
            return c.json(result)
          } catch (error) {
            const message = error instanceof Error ? error.message : 'Invalid evaluation request'
            const status = error instanceof ZodError ? 400 : 500
            return c.json({ error: message }, status)
          }
        },
      }),
    ],
  },
  deployer: new VercelDeployer()
})
