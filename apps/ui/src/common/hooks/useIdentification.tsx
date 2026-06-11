import { useEffect } from 'react'
import { useUser } from '@/store/user.store'
import { UserService } from '@/services/user.service'

export const useIdentification = () => {

  const setUser = useUser(state => state.setUser)
  const user = useUser(state => state.user)

  useEffect(() => {
    if (user) return
    const storedUser = localStorage.getItem('prepper-user')
    if(storedUser) setUser(storedUser)
    else {
      const id = crypto.randomUUID()
      UserService.validateUser(id, true).then(result => {
          setUser(result.id)
          localStorage.setItem('prepper-user', result.id)
      })
    }
  }, [user])
  
}
