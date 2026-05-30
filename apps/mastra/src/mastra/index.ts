import { Mastra } from '@mastra/core/mastra'
import { interviewAgent } from './agents/interview-agent'
import { registerApiRoute } from '@mastra/core/server'
import { VercelDeployer } from '@mastra/deployer-vercel'
import { ChallengeRequestSchema, EvaluationRequestSchema, AllChallengesRequestSchema, UserRequestSchema, HintRequestSchema } from '@repo/shared-types'
import { ZodError } from 'zod'
import { evaluateAnswerWorkflow, generateChallengeWorkflow, hintWorkflow } from './workflows/interview.workflows'
import { listAllQuestions, findUser } from './storage/interview-session.repository'
import * as z from 'zod/v4/core'

function createRequestError(message: string, status = 400): Error & { status: number } {
  const err = new Error(message) as Error & { status: number }
  err.status = status
  return err
}

function parseAndValidateBody<T extends z.$ZodType>(rawBody: string, schema: T): z.output<T> {

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
    console.error(JSON.stringify(error))
    throw ('Zod parsing error')
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

export const mastra = new Mastra({
  agents: { interviewAgent },
  logger: false,
  workflows: {
    generateChallengeWorkflow,
    evaluateAnswerWorkflow,
    hintWorkflow
  },
  server: {
    // Needs one set or logging can break
    port: 4111,
    apiRoutes: [
      registerApiRoute('/interview/challenge', {
        method: 'POST',
        handler: async (c) => {

          try {
            const rawBody = await c.req.text()
            const payload = parseAndValidateBody(rawBody, ChallengeRequestSchema)
            const workflow = mastra.getWorkflow('generateChallengeWorkflow')
            const run = await workflow.createRun()
            const result = await run.start({ inputData: payload })

            if (result.status !== 'success') {
              console.error('Challenge generation failed', JSON.stringify(result))
              return c.json(
                {
                  error: 'Challenge generation failed.',
                },
                500
              )
            }

            return c.json(result.result)
          } catch (error) {
            console.error('Unexpected challenge generation error', String(error).toString())
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

            // console.info(`Evaluation result ${JSON.stringify(result)}`)
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
            console.error(`Evaluation error ${JSON.stringify(error)}`)
            return handleRequestError(c, error, 'Evaluation failed.')
          }
        },
      }),
      registerApiRoute('/interview/hint', {
        method: 'POST',
        handler: async (c) => {

          try {
            const rawBody = await c.req.text()

            const payload = parseAndValidateBody(rawBody, HintRequestSchema)
            const mastra = c.get('mastra')

            const workflow = mastra.getWorkflow('hintWorkflow')
            const run = await workflow.createRun()
            const result = await run.start({ inputData: payload 
            })

            if (result.status !== 'success') {
              return c.json(
                {
                  error: 'Hint generation status other than success.',
                },
                500
              )
            }

            return c.json(result.result)
          } catch (error) {
            console.error(`Hint generation error ${JSON.stringify(error)}`)
            return handleRequestError(c, error, 'Hint generation failed.')
          }
        },
      }),
      registerApiRoute('/interview/all-challenges', {
        method: 'GET',
        handler: async (c) => {
          const query = JSON.stringify(c.req.query())

          try {
            const { start, completed, user } = parseAndValidateBody(query, AllChallengesRequestSchema)

            const result = await listAllQuestions(start, completed, user)
            return c.json(result)
          } catch (error) {
            console.error('Unexpected challenge retrieval error', error)
            return handleRequestError(c, error, 'Unexpected challenge retrieval error')
          }
        },
      }),
      registerApiRoute('/interview/users', {
        method: 'POST',
        handler: async (c) => {
          const rawBody = await c.req.text()

          try {
            const { user, isNewUser } = parseAndValidateBody(rawBody, UserRequestSchema)

            const result = await findUser(user, isNewUser)
            return c.json(result)
          } catch (error) {
            console.error('Unexpected user retrieval error', error)
            return handleRequestError(c, error, 'Unexpected user retrieval error')
          }
        },
      }),
    ],
  },
  deployer: new VercelDeployer()
})
