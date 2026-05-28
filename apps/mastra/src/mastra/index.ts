import { Mastra } from '@mastra/core/mastra'
import { PinoLogger } from '@mastra/loggers'
import { Observability, SensitiveDataFilter, MastraStorageExporter, MastraPlatformExporter } from '@mastra/observability'
import { interviewAgent } from './agents/interview-agent'
import { registerApiRoute } from '@mastra/core/server'
import { VercelDeployer } from '@mastra/deployer-vercel'
import { ChallengeRequestSchema, EvaluationRequestSchema, AllChallengesRequestSchema, UserRequestSchema } from '@repo/shared-types'
import { ZodError } from 'zod'
import { evaluateAnswerWorkflow, generateChallengeWorkflow } from './workflows/interview.workflows'
import { LibSQLStore } from '@mastra/libsql'
import { listAllQuestions, findUser } from './storage/interview-session.repository'
import * as z from 'zod/v4/core'
import { IMastraLogger } from '@mastra/core/logger'

function createRequestError(message: string, status = 400): Error & { status: number } {
  const err = new Error(message) as Error & { status: number }
  err.status = status
  return err
}

function parseAndValidateBody<T extends z.$ZodType>(logger: IMastraLogger, rawBody: string, schema: T): z.output<T> {

  if (!rawBody || !rawBody.trim()) {
    throw createRequestError('Empty request body. Expected JSON.', 400)
  }

  let parsedBody: T
  try {
    parsedBody = JSON.parse(rawBody)
  } catch {
    throw createRequestError('Invalid JSON in request body.', 400)
  }

  const { success, data, error } = z.safeParse(schema, parsedBody)


   if (success) return data
   else {
    logger.error(JSON.stringify(error))
    throw('Zod parsing error')
   }
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
          new MastraStorageExporter(), // Persists traces to storage for Mastra Studio
          new MastraPlatformExporter(), // Sends traces to Mastra Cloud (if MASTRA_CLOUD_ACCESS_TOKEN is set)
        ],
        spanOutputProcessors: [
          new SensitiveDataFilter(), // Redacts sensitive data like passwords, tokens, keys
        ],
        logging: {
          enabled: true, // set to false to disable log forwarding
          level: 'info', // minimum level: 'debug' | 'info' | 'warn' | 'error' | 'fatal'
        },
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
            const payload = parseAndValidateBody(logger, rawBody, ChallengeRequestSchema)
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
            logger.error('Unexpected challenge generation error', String(error).toString())
            return handleRequestError(c, error, 'Challenge generation failed. Unexpected error')
          }
        },
      }),
      registerApiRoute('/interview/evaluate', {
        method: 'POST',
        handler: async (c) => {
          const logger = mastra.getLogger()
          try {
            const rawBody = await c.req.text()
            
            const payload = parseAndValidateBody(logger, rawBody, EvaluationRequestSchema)
            const mastra = c.get('mastra')

            logger.error(`payload ${JSON.stringify(payload)}`)
            const workflow = mastra.getWorkflow('evaluateAnswerWorkflow')
            const run = await workflow.createRun()
            const result = await run.start({ inputData: payload })

            // logger.info(`Evaluation result ${JSON.stringify(result)}`)
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
            logger.error(`Evaluation error ${JSON.stringify(error)}`)
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
            const { start, completed, user } = parseAndValidateBody(logger, query, AllChallengesRequestSchema)

            const result = await listAllQuestions(start, completed, user)
            logger.info('All challenges', result.data[0])
            return c.json(result)
          } catch (error) {
            logger.error('Unexpected challenge retrieval error', error)
            return handleRequestError(c, error, 'Unexpected challenge retrieval error')
          }
        },
      }),
      registerApiRoute('/interview/users', {
        method: 'POST',
        handler: async (c) => {
          const mastra = c.get('mastra')
          const logger = mastra.getLogger()
          const rawBody = await c.req.text()

          try {
            const { user, isNewUser } = parseAndValidateBody(logger, rawBody, UserRequestSchema)

            const result = await findUser(user, isNewUser)
            return c.json(result)
          } catch (error) {
            logger.error('Unexpected user retrieval error', error)
            return handleRequestError(c, error, 'Unexpected user retrieval error')
          }
        },
      }),
    ],
  },
  deployer: new VercelDeployer()
})
