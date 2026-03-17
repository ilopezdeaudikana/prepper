import type { IMastraLogger } from '@mastra/core/logger'

export interface ILogger {
  info: (msg: string, data?: any) => void
  error: (msg: string, data?: any) => void
}

export const Logger = (logger: IMastraLogger): ILogger => ({
  info: (msg: string, data?: any) => logger.info(msg, data),
  error: (msg: string, data?: any) => logger.error(msg, data),
})