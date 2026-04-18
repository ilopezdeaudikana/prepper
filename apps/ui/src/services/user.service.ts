import { parseResponse } from "@/common/utils/parse-api-response"
import type { UserResponse } from "@repo/shared-types"

const MASTRA_API_URL = import.meta.env.VITE_MASTRA_API_URL

const getApiUrl = (path: string) => new URL(path, `${MASTRA_API_URL}`).toString()


export const UserService = {
  async validateUser(user: string, isNewUser: boolean) {
  
    const response = await fetch(getApiUrl('interview/users'), {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ user, isNewUser }),
    })
    return parseResponse<UserResponse>(response, 'User generation / retrieval failed.')
  },

}
