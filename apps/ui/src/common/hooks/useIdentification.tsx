import { useEffect, useState } from 'react'
import { useUser } from '@/store/user.store'
import { UserService } from '@/services/user.service'
import { App } from 'antd'

let isCreatingUser = false

export const useIdentification = () => {
  const setUserSession = useUser((state) => state.setUserSession)
  const setRecoveryPhrase = useUser((state) => state.setRecoveryPhrase)
  const session = useUser((state) => state.session)
  const { message } = App.useApp()

  const [isPrivate, setIsPrivate] = useState<boolean>()

  useEffect(() => {
    if (isCreatingUser) return
    if (session) return
    const storedUserSession = localStorage.getItem('prepper-session')

    const isPrivateEnv = localStorage.getItem('prepper-private')

    setIsPrivate(!!isPrivateEnv)

    if (storedUserSession && isPrivate) setUserSession(storedUserSession)

    else {
      isCreatingUser = true
      const id = crypto.randomUUID()
      UserService.validateUser(id)
        .then((result) => {
          setUserSession(result.id)
          if (result.recoveryPhrase) setRecoveryPhrase(result.recoveryPhrase)
          localStorage.setItem('prepper-session', result.id)
        })
        .catch(() => {
          message.error('Error creating user')
        })
        .finally(() => (isCreatingUser = false))
    }
  }, [session])

  return { isPrivate }
}
