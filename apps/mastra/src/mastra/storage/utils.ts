import crypto from 'node:crypto'

const SESSION_TOKEN_VERSION = 'v1'
const AES_ALGORITHM = 'aes-256-gcm'

const toBase64Url = (value: Buffer) =>
  value
    .toString('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/g, '')

const fromBase64Url = (value: string) => {
  const normalized = value.replace(/-/g, '+').replace(/_/g, '/')
  const padding = '='.repeat((4 - (normalized.length % 4)) % 4)
  return Buffer.from(`${normalized}${padding}`, 'base64')
}

const getSessionTokenKey = (secret: string) =>
  crypto.createHash('sha256').update(secret).digest()

export const createSessionToken = (secret: string, sessionId: string) =>
  (() => {
    const iv = crypto.randomBytes(12)
    const cipher = crypto.createCipheriv(AES_ALGORITHM, getSessionTokenKey(secret), iv)
    const encrypted = Buffer.concat([cipher.update(sessionId, 'utf8'), cipher.final()])
    const authTag = cipher.getAuthTag()

    return [
      SESSION_TOKEN_VERSION,
      toBase64Url(iv),
      toBase64Url(authTag),
      toBase64Url(encrypted),
    ].join('.')
  })()

const isUuid = (value: string) =>
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value)

export const resolveSessionIdFromToken = (secret: string, token?: string) => {
  if (!token) {
    return undefined
  }

  if (isUuid(token)) {
    return token
  }

  const [version, ivPart, authTagPart, encryptedPart] = token.split('.')
  if (version === SESSION_TOKEN_VERSION && ivPart && authTagPart && encryptedPart) {
    try {
      const decipher = crypto.createDecipheriv(
        AES_ALGORITHM,
        getSessionTokenKey(secret),
        fromBase64Url(ivPart),
      )
      decipher.setAuthTag(fromBase64Url(authTagPart))
      const decrypted = Buffer.concat([
        decipher.update(fromBase64Url(encryptedPart)),
        decipher.final(),
      ]).toString('utf8')

      return isUuid(decrypted) ? decrypted : undefined
    } catch {
      return undefined
    }
  }
  
  return undefined
}

export const getYesterdayTimestamp = (): string => {
  const yesterday = new Date()
  yesterday.setDate(yesterday.getDate() - 1)
  return yesterday.toISOString()
}
