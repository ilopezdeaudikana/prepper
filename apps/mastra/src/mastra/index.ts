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

// Plain-function request / error helpers (no classes)
function createRequestError(message: string, status = 400): Error & { status: number } {
  const err = new Error(message) as Error & { status: number }
  err.status = status
  return err
}

async function parseAndValidateBody<T>(c: any, schema: { parse: (v: unknown) => T }): Promise<T> {
  const rawBody = await c.req.text()
  if (!rawBody || !rawBody.trim()) {
    throw createRequestError('Empty request body. Expected JSON.', 400)
  }

  let parsedBody: unknown
  try {
    parsedBody = JSON.parse(rawBody)
  } catch {
    throw createRequestError('Invalid JSON in request body.', 400)
  }

  return schema.parse(parsedBody)
}

function handleRequestError(c: any, error: unknown, fallbackMessage: string) {
  const message = error instanceof Error ? error.message : fallbackMessage
  const status =
    error instanceof ZodError ? 400 : (error && typeof (error as any).status === 'number' ? (error as any).status : 500)
  return c.json(
    {
      error: status === 400 ? message : fallbackMessage,
    },
    status
  )
}

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
            const payload = await parseAndValidateBody(c, ChallengeRequestSchema)
            const mastra = c.get('mastra')
            const workflow = mastra.getWorkflow('generateChallengeWorkflow')
            const run = await workflow.createRun()
            const result = await run.start({ inputData: payload })

            if (result.status !== 'success') {
              return c.json(
                {
                  error: 'Challenge generation failed.',
                },
                500
              )
            }

            return c.json(result.result)
          } catch (error) {
            return handleRequestError(c, error, 'Challenge generation failed.')
          }
        },
      }),
      registerApiRoute("/interview/evaluate", {
        method: "POST",
        handler: async (c) => {
          try {
            const payload = await parseAndValidateBody(c, EvaluationRequestSchema)
            const mastra = c.get('mastra')
            const workflow = mastra.getWorkflow('evaluateAnswerWorkflow')
            const run = await workflow.createRun()
            const result = await run.start({ inputData: payload })

            if (result.status !== 'success') {
              return c.json(
                {
                  error: 'Evaluation failed.',
                },
                500
              )
            }

            return c.json(result.result)
          } catch (error) {
            return handleRequestError(c, error, 'Evaluation failed.')
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

            const payload = await parseAndValidateBody(c, PrefillRequestSchema)
            const result = await prefillChallengePool(payload)
            console.log(result)
            return c.json(result)
          } catch (error) {
            console.log(error)
            return handleRequestError(c, error, 'Prefill failed.')
          }
        },
      }),
    ],
  },
  deployer: new VercelDeployer()
})
