import React, { useState } from 'react'
import { Modal, Input, Checkbox, Flex, Typography } from 'antd'
import { useUser } from '@/store/user.store'
import { UserService } from '@/services/user.service'

export const Identification: React.FC = () => {
  const [open, setOpen] = useState(true)
  const [isNewUser, setIsNewUser] = useState(false)
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
          <label htmlFor="resuse">Add new user</label>
          <Checkbox id="reuse" checked={isNewUser} onChange={(e) => setIsNewUser(e.target.checked)} />
        </Flex>
        {error && <Typography.Paragraph>{error}</Typography.Paragraph>}
      </Flex>
    </Modal >
    </>
  )
}
