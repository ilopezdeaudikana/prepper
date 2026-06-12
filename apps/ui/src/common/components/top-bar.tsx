import { Card, Flex, Switch, Typography } from 'antd'
import { useEffect, useState } from 'react'
import { Avatar } from '@/common/components/avatar'
import { useIdentification } from '@/common/hooks/useIdentification'

export const Topbar = () => {
  
  const { isPrivate } = useIdentification()
  const [isPublic, setIsPublic] = useState(true)

  const onChange = (checked: boolean) => {
    setIsPublic(checked)
    if (checked) localStorage.removeItem('prepper-private')
    if (!checked) localStorage.setItem('prepper-private', 'yes')
  }

  useEffect(() => {
    if(isPrivate) {
      setIsPublic(false)
    }
  }, [isPrivate])

  return (
    <Card styles={{ body: { padding: '0.5rem 1.25rem' } }}>
      <div className="flex justify-between items-center gap-2">
        <Flex gap={8}>
          <Typography>Using a shared/public computer:</Typography>
          <Switch value={isPublic} onChange={onChange} />
        </Flex>
        <Avatar isPublic={isPublic}/>
      </div>
    </Card>
  )
}
