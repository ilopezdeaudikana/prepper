import { Button, Card, Flex, Switch, Tooltip, Typography } from 'antd'
import { useState } from 'react'
import { Avatar } from '@/common/components/avatar'
import { useIdentification } from '@/common/hooks/useIdentification'
import { useNavigate } from '@tanstack/react-router'
import { BarChart3, History, Home, Upload } from 'lucide-react'

export const Topbar = () => {
  const { isPrivate } = useIdentification()
  const [isPublic, setIsPublic] = useState(!isPrivate)
  const navigate = useNavigate()

  const onChange = (checked: boolean) => {
    setIsPublic(checked)
    if (checked) localStorage.removeItem('prepper-private')
    if (!checked) localStorage.setItem('prepper-private', 'yes')
  }

  return (
    <Card styles={{ body: { padding: '0.5rem 1.25rem' } }}>
      <div className="flex justify-between items-center gap-2">
        <Flex gap={8} align="center" wrap>
          <Tooltip title="Challenges">
            <Button
              icon={<Home className="size-4" />}
              onClick={() => navigate({ to: '/' })}
            />
          </Tooltip>
          <Button
            icon={<History className="size-4" />}
            onClick={() => navigate({ to: '/history' })}
          >
            History
          </Button>
          <Button
            icon={<BarChart3 className="size-4" />}
            onClick={() => navigate({ to: '/dashboard' })}
          >
            Dashboard
          </Button>
          <Button
            icon={<Upload className="size-4" />}
            onClick={() => navigate({ to: '/import' })}
          >
            Import
          </Button>
        </Flex>
        <Flex gap={32} align="center">
          <Flex gap={8} align="center">
            <Typography>Using a shared/public computer:</Typography>
            <Switch value={isPublic} onChange={onChange} />
          </Flex>
          <Avatar isPublic={isPublic} />
        </Flex>
      </div>
    </Card>
  )
}
