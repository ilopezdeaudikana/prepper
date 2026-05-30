import { useEffect, useState } from 'react'
import { Modal, Input, Checkbox, Flex, Typography } from 'antd'
import { useUser } from '@/store/user.store'
import { UserService } from '@/services/user.service'

export const Identification = () => {
  const [open, setOpen] = useState(false)
  const [isNewUser, setIsNewUser] = useState(false)
  const [rememberMe, setRememberMe] = useState(false)
  const [localUser, setLocalUser] = useState('')
  const [error, setError] = useState('')
  const [confirmLoading, setConfirmLoading] = useState(false)

  const setUser = useUser(state => state.setUser)

  const handleOk = async () => {
    setConfirmLoading(true)
    try {
      const { id } = await UserService.validateUser(localUser, isNewUser)
      if (id) {
        setUser(id)
        if(rememberMe) localStorage.setItem('prepper-user', id)
        setOpen(false)
      } else {
        setError(`We could not find ${localUser}. Check "Add new user" if you want to add it.`)
      }
    } catch (error) {
      console.log(error)
      setError('Unexpected error adding or getting the user')
    } finally {
      setConfirmLoading(false)
    }
  }

  const handleCancel = () => {
    setOpen(false)
  }

  useEffect(() => {
    const user = localStorage.getItem('prepper-user')
    if(user) setUser(user)
    else setOpen(true)
  }, [])

  return (
    <>
      <Modal
        title="Set your user"
        open={open}
        onOk={handleOk}
        onCancel={handleCancel}
        confirmLoading={confirmLoading}
        closable={false}
        cancelButtonProps={{ style: { display: 'none' } }}
        okButtonProps={{ disabled:  !localUser }}
        mask={{ closable: false }}
      >
      <Flex vertical gap={8}>
        <label htmlFor="username">Your user name:</label>
        <Input id="username" onChange={(e) => setLocalUser(e.target.value)} />
        <Flex gap={8}>
          <label htmlFor="reuse">Add new user</label>
          <Checkbox id="reuse" checked={isNewUser} onChange={(e) => setIsNewUser(e.target.checked)} />
        </Flex>
        <Flex gap={8}>
          <label htmlFor="remember">Remember me</label>
          <Checkbox id="remember" checked={rememberMe} onChange={(e) => setRememberMe(e.target.checked)} />
        </Flex>
        {error && <Typography.Paragraph>{error}</Typography.Paragraph>}
      </Flex>
    </Modal >
    </>
  )
}
