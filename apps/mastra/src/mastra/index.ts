import { Mastra } from '@mastra/core/mastra'
import { interviewAgent } from './agents/interview-agent'
import { registerApiRoute } from '@mastra/core/server'
import { VercelDeployer } from '@mastra/deployer-vercel'
import { ChallengeRequestSchema, EvaluationRequestSchema, AllChallengesRequestSchema, UserRequestSchema, HintRequestSchema, ChallengeDeleteSchema, UserRecoveryRequestSchema } from '@repo/shared-types'
import { evaluateAnswerWorkflow, generateChallengeWorkflow, hintWorkflow } from './workflows/interview.workflows'
import { listAllQuestions, getQuestion, deleteQuestion } from './storage/challenge.repository'
import { findByPhrase, findUser, generateRecoveryPhrase, upsertUser } from './storage/user.repository'
import { handleRequestError, parseAndValidateBody } from './utils'

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
      registerApiRoute('/challenge', {
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
      registerApiRoute('/challenge/:id', {
        method: 'GET',
        handler: async (c) => {
          try {
            const query = c.req.param()
            const result = await getQuestion(query.id)
            return c.json(result)
          } catch (error) {
            console.error('Unexpected challenge retrieval error', error)
            return handleRequestError(c, error, 'Unexpected challenge retrieval error')

          }
        },
      }),
      registerApiRoute('/challenge', {
        method: 'DELETE',
        handler: async (c) => {
          try {
            const rawBody = await c.req.text()
            const payload = parseAndValidateBody(rawBody, ChallengeDeleteSchema)
            const result = await deleteQuestion(payload.id, payload.user)
            return c.json(result)
          } catch (error) {
            console.error('Unexpected error deleting question', error)
            return handleRequestError(c, error, 'Unexpected challenge delete error')

          }
        },
      }),
      registerApiRoute('/challenge/evaluate', {
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
      registerApiRoute('/challenge/hint', {
        method: 'POST',
        handler: async (c) => {
          try {
            const rawBody = await c.req.text()

            const payload = parseAndValidateBody(rawBody, 
              HintRequestSchema
            )
            const mastra = c.get('mastra')

            const workflow = mastra.getWorkflow('hintWorkflow')
            const run = await workflow.createRun()
            const result = await run.start({
              inputData: payload
            })

            if (result.status !== 'success') {
              console.error(`Hint generation not succesful ${JSON.stringify(result)}`)
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
      registerApiRoute('/challenge', {
        method: 'GET',
        handler: async (c) => {
          const query = JSON.stringify(c.req.query())
          try {
            const { start, completed, topic, level, type, user } = parseAndValidateBody(query, AllChallengesRequestSchema)
            const result = await listAllQuestions(start ?? 0, { completed, topic, level, type }, user)
            return c.json(result)
          } catch (error) {
            console.error('Unexpected challenge retrieval error', error)
            return handleRequestError(c, error, 'Unexpected challenge retrieval error')
          }
        },
      }),
      registerApiRoute('/user', {
        method: 'POST',
        handler: async (c) => {
          const rawBody = await c.req.text()

          try {
            const { user } = parseAndValidateBody(rawBody, UserRequestSchema)

            const result = await upsertUser(user)
            return c.json(result)
          } catch (error) {
            console.error('Unexpected user retrieval error', error)
            return handleRequestError(c, error, 'Unexpected user retrieval error')
          }
        },
      }),
      registerApiRoute('/user/recovery', {
        method: 'POST',
        handler: async (c) => {
          const rawBody = await c.req.text()

          try {
            const { recoveryPhrase } = parseAndValidateBody(rawBody, UserRecoveryRequestSchema)

            const result = await findByPhrase(recoveryPhrase)
            return c.json(result)
          } catch (error) {
            console.error('Unexpected user recovery error', error)
            return handleRequestError(c, error, 'Unexpected user recovery error')
          }
        },
      }),
      registerApiRoute('/user/:id/backup', {
        method: 'POST',
        handler: async (c) => {
          const query = c.req.param()
          try {
            const result = await generateRecoveryPhrase(query.id)
            return c.json(result)
          } catch (error) {
            console.error('Unexpected recovery phrase generation error', error)
            return handleRequestError(c, error, 'Unexpected recovery phrase generation error')
          }
        },
      }),
      registerApiRoute('/user/:id', {
        method: 'GET',
        handler: async (c) => {
          const query = c.req.param()
          try {

            const result = await findUser(query.id)
            return c.json(result)
          } catch (error) {
            console.error('User not found', error)
            return handleRequestError(c, error, 'User not found')
          }
        },
      }),
    ],
  },
  deployer: new VercelDeployer()
})
