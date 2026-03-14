import crypto from 'node:crypto'
export const hmacHex = (secret: string, message: string) =>
  crypto.createHmac('sha256', secret).update(message).digest('hex')


export const getYesterdayTimestamp = (): string => {
  const yesterday = new Date()
  yesterday.setDate(yesterday.getDate() - 1)
  return yesterday.toISOString()
}