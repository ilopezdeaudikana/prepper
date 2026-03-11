import crypto from 'node:crypto'
export const hmacHex = (secret: string, message: string) =>
  crypto.createHmac('sha256', secret).update(message).digest('hex')