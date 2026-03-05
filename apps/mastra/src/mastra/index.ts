
import { Mastra } from '@mastra/core/mastra'
import { PinoLogger } from '@mastra/loggers'
import { Observability, DefaultExporter, CloudExporter, SensitiveDataFilter } from '@mastra/observability'
import { interviewAgent } from './agents/interview-agent'
import { registerApiRoute } from '@mastra/core/server'
import { VercelDeployer } from '@mastra/deployer-vercel'
import { ChallengeRequestSchema, EvaluationRequestSchema } from '@repo/shared-types'
import { z, ZodError } from 'zod'
import { evaluateAnswerWorkflow, generateChallengeWorkflow } from './workflows/interview.workflows'
import { prefillChallengePool } from './agents/interview-agent.service'

const PrefillRequestSchema = z.object({
  topics: z.array(z.string().min(1)).min(1).max(20),
  levels: z.array(z.string().min(1)).min(1).max(10),
  countPerPair: z.number().int().min(1).max(10).default(1),
})

export const mastra = new Mastra({
  agents: { interviewAgent },
  workflows: {
    generateChallengeWorkflow,
    evaluateAnswerWorkflow,
  },
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
            const mastra = c.get('mastra')
            const workflow = mastra.getWorkflow('generateChallengeWorkflow')
            const run = await workflow.createRun()
            const result = await run.start({ inputData: payload })

            if (result.status !== 'success') {
              const errorMessage =
                result.status === 'failed'
                  ? result.error.message
                  : result.status === 'tripwire'
                    ? result.tripwire.reason
                    : 'Challenge workflow did not complete successfully'
              return c.json({ error: errorMessage }, 500)
            }

            return c.json(result.result)
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
            const payload = EvaluationRequestSchema.parse(await c.req.json())
            const mastra = c.get('mastra')
            const workflow = mastra.getWorkflow('evaluateAnswerWorkflow')
            const run = await workflow.createRun()
            const result = await run.start({ inputData: payload })

            if (result.status !== 'success') {
              const errorMessage =
                result.status === 'failed'
                  ? result.error.message
                  : result.status === 'tripwire'
                    ? result.tripwire.reason
                    : 'Evaluation workflow did not complete successfully'
              return c.json({ error: errorMessage }, 500)
            }

            return c.json(result.result)
          } catch (error) {
            const message = error instanceof Error ? error.message : 'Invalid evaluation request'
            const status = error instanceof ZodError ? 400 : 500
            return c.json({ error: message }, status)
          }
        },
      }),
      registerApiRoute("/interview/prefill", {
        method: "POST",
        handler: async (c) => {
          try {
            const configuredSecret = process.env.PREFILL_SECRET
            if (!configuredSecret) {
              return c.json({ error: 'Prefill endpoint not configured' }, 500)
            }

            const authorization = c.req.header('authorization')
            if (authorization !== `Bearer ${configuredSecret}`) {
              return c.json({ error: 'Unauthorized' }, 401)
            }

            const payload = PrefillRequestSchema.parse(await c.req.json())
            const result = await prefillChallengePool(payload)
            return c.json(result)
          } catch (error) {
            const message = error instanceof Error ? error.message : 'Invalid prefill request'
            const status = error instanceof ZodError ? 400 : 500
            return c.json({ error: message }, status)
          }
        },
      }),
    ],
  },
  deployer: new VercelDeployer()
})
