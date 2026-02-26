
import { Mastra } from '@mastra/core/mastra'
import { PinoLogger } from '@mastra/loggers'
import { Observability, DefaultExporter, CloudExporter, SensitiveDataFilter } from '@mastra/observability'
import { interviewAgent } from './agents/interview-agent'
import { registerApiRoute } from '@mastra/core/server'
import { getChallenge, submitAnswer } from './agents/interview-agent.service'
import { VercelDeployer } from '@mastra/deployer-vercel'

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
          const { topic, level, previousQuestions } = await c.req.json();
          const result = await getChallenge(topic, level, previousQuestions ?? []);
          return c.json(result);
        },
      }),
      registerApiRoute("/interview/evaluate", {
        method: "POST",
        handler: async (c) => {
          const body = await c.req.json();
          const result = await submitAnswer(body.question, body.answer, body.level);
          return c.json(result);
        },
      }),
    ],
  },
  deployer: new VercelDeployer()
})
