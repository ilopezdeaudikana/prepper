import { useEffect } from 'react'
import { useUser } from '@/store/user.store'
import { UserService } from '@/services/user.service'
import { App } from 'antd'

let isCreatingUser = false

export const useIdentification = () => {

  const setUser = useUser(state => state.setUser)
  const user = useUser(state => state.user)
  const { message } = App.useApp()

  useEffect(() => {
    if (isCreatingUser) return
    if (user) return
    const storedUser = localStorage.getItem('prepper-user')
    if (storedUser) setUser(storedUser)
    else {
      isCreatingUser = true
      const id = crypto.randomUUID()
      UserService.validateUser(id).then(result => {
          setUser(result.id)
          localStorage.setItem('prepper-user', result.id)
      }).catch(() => {
        message.error('Error creating user')
      })
      .finally(() => isCreatingUser = false)
    }
  }, [user])
}
