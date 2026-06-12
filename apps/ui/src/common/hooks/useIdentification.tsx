import { useEffect, useState } from 'react'
import { useUser } from '@/store/user.store'
import { UserService } from '@/services/user.service'
import { App } from 'antd'
import type { UserResponse } from '@repo/shared-types'

let isCreatingUser = false

export const useIdentification = () => {
  const setUserSession = useUser((state) => state.setUserSession)
  const setRecoveryPhrase = useUser((state) => state.setRecoveryPhrase)
  const session = useUser((state) => state.session)
  const { message } = App.useApp()

  const [isPrivate, setIsPrivate] = useState<boolean>()

  const userRequest = (
    id: string,
    callback: (is: string) => Promise<UserResponse>,
    errorMessage: string
  ) => {
    isCreatingUser = true
    callback(id)
      .then((result) => {
        setUserSession(result.id)
        if (result.recoveryPhrase) setRecoveryPhrase(result.recoveryPhrase)
        localStorage.setItem('prepper-session', result.id)
      })
      .catch(() => {
        message.error(errorMessage)
        localStorage.removeItem('prepper-session')
      })
      .finally(() => (isCreatingUser = false))
  }

  useEffect(() => {
    if (isCreatingUser) return
    if (session) return
    const storedUserSession = localStorage.getItem('prepper-session')

    const isPrivateEnv = localStorage.getItem('prepper-private')

    setIsPrivate(!!isPrivateEnv)

    if (storedUserSession && isPrivateEnv) {
      userRequest(storedUserSession,UserService.getUser, 'User not found')
    } else {
      const id = crypto.randomUUID()
      userRequest(id, UserService.validateUser, 'Error creating user')
    }
  }, [session])

  return { isPrivate }
}
