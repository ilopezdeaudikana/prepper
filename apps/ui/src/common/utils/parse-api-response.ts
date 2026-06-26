import type { ApiError } from '@repo/shared-types'

export const parseResponse = async <T>(response: Response, fallbackMessage: string): Promise<T> => {
  const body = await response.json().catch(() => null) as { error?: string } | null

  if (!response.ok) {
    const error = new Error(body?.error ?? fallbackMessage) as ApiError
    error.status = response.status
    throw error
  }

  return body as T
}
