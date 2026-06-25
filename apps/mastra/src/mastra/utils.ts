import { safeParse, ZodError } from 'zod'
import { $ZodType, output } from 'zod/v4/core'

export const createRequestError = (message: string, status = 400): Error & { status: number } => {
  const err = new Error(message) as Error & { status: number }
  err.status = status
  return err
}

export const parseAndValidateBody = <T extends $ZodType>(rawBody: string, schema: T): output<T> => {

  if (!rawBody || !rawBody.trim()) {
    throw createRequestError('Empty request body. Expected JSON.', 400)
  }

  let parsedBody: T
  try {
    parsedBody = JSON.parse(rawBody)
  } catch {
    throw createRequestError('Invalid JSON in request body.', 400)
  }

  const { success, data, error } = safeParse(schema, parsedBody)


  if (success) return data
  else {
    console.error('IN PARSER', JSON.stringify(error))
    throw ('Zod parsing error')
  }
}

export const handleRequestError = (c: any, error: unknown, fallbackMessage: string) => {
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

