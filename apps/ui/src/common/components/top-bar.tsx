import { Button, Card, Flex, Switch, Tooltip, Typography } from 'antd'
import { useState } from 'react'
import { Avatar } from '@/common/components/avatar'
import { useIdentification } from '@/common/hooks/useIdentification'
import { useNavigate } from '@tanstack/react-router'
import { BarChart3, History, Home, Upload } from 'lucide-react'
import { useQueryClient } from '@tanstack/react-query'
import { useProgress } from '@/store/progress.store'
import { useConfiguration } from '@/store/configuration.store'

export const Topbar = () => {
  const { isPrivate } = useIdentification()
  const [isPublic, setIsPublic] = useState(!isPrivate)
  const navigate = useNavigate()
  const resetProgress = useProgress((state) => state.resetProgress)
  const resetConfiguration = useConfiguration(
    (state) => state.resetConfiguration,
  )
  const queryClient = useQueryClient()

  const onChange = (checked: boolean) => {
    setIsPublic(checked)
    if (checked) localStorage.removeItem('prepper-private')
    if (!checked) localStorage.setItem('prepper-private', 'yes')
  }

  const goHome = () => {
    queryClient.invalidateQueries({ queryKey: ['challenge'] })
    resetProgress()
    resetConfiguration()
    navigate({ to: '/' })
  }

  return (
    <Card styles={{ body: { padding: '0.5rem 1.25rem' } }}>
      <div className="flex flex-col items-start justify-between gap-2 md:flex-row md:items-center ">
        <Flex gap={8} align="center" wrap>
          <Tooltip title="Challenges">
            <Button icon={<Home className="size-4" />} onClick={goHome} />
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
            <Typography>Using a public computer:</Typography>
            <Switch value={isPublic} onChange={onChange} />
          </Flex>
          <Avatar isPublic={isPublic} />
        </Flex>
      </div>
    </Card>
  )
}
