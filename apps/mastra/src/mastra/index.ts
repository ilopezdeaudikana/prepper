import { Mastra } from '@mastra/core/mastra'
import { PinoLogger } from '@mastra/loggers'
import { Observability, DefaultExporter, CloudExporter, SensitiveDataFilter } from '@mastra/observability'
import { interviewAgent } from './agents/interview-agent'
import { registerApiRoute } from '@mastra/core/server'
import { VercelDeployer } from '@mastra/deployer-vercel'
import { ChallengeRequestSchema, EvaluationRequestSchema, AllChallengesRequestSchema } from '@repo/shared-types'
import { ZodError } from 'zod'
import { evaluateAnswerWorkflow, generateChallengeWorkflow } from './workflows/interview.workflows'
import { LibSQLStore } from '@mastra/libsql'
import { listAllQuestions } from './storage/interview-session.repository'


function createRequestError(message: string, status = 400): Error & { status: number } {
  const err = new Error(message) as Error & { status: number }
  err.status = status
  return err
}

function parseAndValidateBody<T>(rawBody: string, schema: { parse: (v: unknown) => T }): T {

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

const storage = process.env.NODE_ENV === 'production'
  ? undefined
  : new LibSQLStore({
    id: 'dev-db',
    url: 'file:./mastra.db'
  })

export const mastra = new Mastra({
  agents: { interviewAgent },
  storage,
  logger: new PinoLogger({
    name: 'Mastra',
    level: 'info'
  }),
  workflows: {
    generateChallengeWorkflow,
    evaluateAnswerWorkflow,
  },
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
      registerApiRoute('/interview/challenge', {
        method: 'POST',
        handler: async (c) => {
          const mastra = c.get('mastra')
          const logger = mastra.getLogger()

          try {
            const rawBody = await c.req.text()
            const payload = parseAndValidateBody(rawBody, ChallengeRequestSchema)
            const workflow = mastra.getWorkflow('generateChallengeWorkflow')
            const run = await workflow.createRun()
            const result = await run.start({ inputData: payload })

            if (result.status !== 'success') {
              logger.error('Challenge generation failed', JSON.stringify(result))
              return c.json(
                {
                  error: 'Challenge generation failed.',
                },
                500
              )
            }

            return c.json(result.result)
          } catch (error) {
            logger.error('Unexpected challenge generation error')
            return handleRequestError(c, error, 'Challenge generation failed. Unexpected error')
          }
        },
      }),
      registerApiRoute('/interview/evaluate', {
        method: 'POST',
        handler: async (c) => {
          try {
            const rawBody = await c.req.text()
            const payload = parseAndValidateBody(rawBody, EvaluationRequestSchema)
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
      registerApiRoute('/interview/all-challenges', {
        method: 'GET',
        handler: async (c) => {
          const mastra = c.get('mastra')
          const logger = mastra.getLogger()
          const query = JSON.stringify(c.req.query())

          try {
            const { start, completed } = parseAndValidateBody(query, AllChallengesRequestSchema)

            const result = await listAllQuestions(start, completed, logger)
            logger.info('All challenges', result.data[0])
            return c.json(result)
          } catch (error) {
            logger.error('Unexpected challenge retrieval error', error)
            return handleRequestError(c, error, 'Unexpected challenge retrieval error')
          }
        },
      }),
    ],
  },
  deployer: new VercelDeployer()
})
