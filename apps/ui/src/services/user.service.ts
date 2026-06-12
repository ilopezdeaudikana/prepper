import { parseResponse } from "@/common/utils/parse-api-response"
import type { UserResponse } from "@repo/shared-types"

const MASTRA_API_URL = import.meta.env.VITE_MASTRA_API_URL

const getApiUrl = (path: string) => new URL(path, `${MASTRA_API_URL}`).toString()


export const UserService = {
  async validateUser(user: string) {
  
    const response = await fetch(getApiUrl('users'), {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ user })
    })
    return parseResponse<UserResponse>(response, 'User generation / retrieval failed.')
  },

  async generateRecoveryPhrase(user: string) {
    const response = await fetch(getApiUrl('users/recovery'), {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ user })
    })
    return parseResponse<{ recoveryPhrase: string }>(response, 'User recovery phrase generation failed.')
  },
  
  async sendRecoveryPhrase(userId: string, recoveryPhrase: string) {
    const response = await fetch(getApiUrl(`users/${userId}/backup`), {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ recoveryPhrase })
    })
    return parseResponse<UserResponse>(response, 'Sending recovery phrase failed.')
  }
}
