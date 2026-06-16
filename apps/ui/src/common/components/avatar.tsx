import { UserService } from '@/services/user.service'
import { useUser } from '@/store/user.store'
import { useQueryClient } from '@tanstack/react-query'
import {
  Avatar as AntAvatar,
  App,
  Button,
  Card,
  Flex,
  Input,
  Popover,
  Switch,
  Typography,
} from 'antd'
import { RefreshCcw } from 'lucide-react'
import { useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'

export const Avatar = ({ isPublic }: { isPublic: boolean }) => {
  const [inFlight, setInFlight] = useState(false)
  const [hasCopied, setHasCopied] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)
  const session = useUser((state) => state.session)
  const setSession = useUser((state) => state.setUserSession)
  const hasPhrase = useUser((state) => state.recoveryPhrase)
  const timeout  = useRef<ReturnType<typeof setTimeout>>(null)

  const queryClient = useQueryClient()
  const navigate = useNavigate()

  const [phrase, setPhrase] = useState<string>()
  const [alternativePhrase, setAlternativePhrase] = useState<string>()
  const [alternativeUser, setAlternativeUser] = useState<boolean>()

  const { message } = App.useApp()

  const generatePhrase = async () => {
    setInFlight(true)
    try {
      const result = await UserService.generateRecoveryPhrase(session)
      setPhrase(result.recoveryPhrase)
    } catch (error) {
      message.error('Error generating recovery phrase')
    } finally {
      setInFlight(false)
    }
  }

  const sendPhrase = async () => {
    if (!alternativePhrase) return
    setInFlight(true)
    try {
      const result = await UserService.sendRecoveryPhrase(alternativePhrase)
      setPhrase(result.recoveryPhrase)
      setSession(result.id)
      localStorage.setItem('prepper-session', result.id)
      queryClient.invalidateQueries({ queryKey: ['challenge'] })
      // navigate('/')
      message.success('New user loaded')
      timeout.current = setTimeout(() => {
        setMenuOpen(false)
      }, 1250)
    } catch (error) {
      message.error('Error switching user')
    } finally {
      setInFlight(false)
    }
  }

  const handleCopy = () => {
    setHasCopied(true)
    timeout.current = setTimeout(() => {
      setMenuOpen(false)
    }, 1250)
  }

  const handleInputChange: React.ChangeEventHandler<
    HTMLInputElement,
    HTMLInputElement
  > = (e) => {
    setAlternativePhrase(e.target.value)
  }

  const handleOpenChange = (open: boolean) => {
    setMenuOpen(open)
  }

  const handleSwitchUser = (open: boolean) => {
    setAlternativeUser(open)
  }

  const content = (
    <Flex vertical gap={12} style={{ width: '25rem' }}>
      <Typography>
        We don't collect emails or personal data, which means your progress is
        stored entirely in this browser. To access your data from another device
        or protect it from being cleared, generate or insert a Recovery Phrase.
      </Typography>

      {!hasPhrase && !phrase && (
        <Button
          type="primary"
          disabled={inFlight || isPublic}
          onClick={generatePhrase}
        >
          Generate Recovery Phrase
        </Button>
      )}

      <Flex gap={8}>
        <Typography>Do you want to load another user:</Typography>
        <Switch value={alternativeUser} onChange={handleSwitchUser} />
      </Flex>
      {alternativeUser && (
        <>
          <Input
            value={alternativePhrase}
            placeholder="Insert recovery phrase"
            onChange={handleInputChange}
          />
          <Button disabled={inFlight} onClick={sendPhrase}>
            Switch user
          </Button>
        </>
      )}

      {phrase && !hasCopied && (
        <Card
          styles={{
            body: {
              color: 'oklch(0.922 0 0)',
              backgroundColor: 'oklch(0.398 0.07 227.392)',
              padding: '0.75rem',
            },
          }}
        >
          <Typography.Paragraph
            copyable={{ text: phrase, onCopy: handleCopy }}
            actions={{ placement: 'end' }}
            styles={{ root: { color: 'oklch(0.922 0 0)', margin: 0 } }}
          >
            {phrase}
          </Typography.Paragraph>
        </Card>
      )}
      {hasCopied && <Typography.Paragraph type="success">Copied</Typography.Paragraph>}
    </Flex>
  )

  return (
    <Popover
      placement="bottom"
      title="Save progress"
      content={content}
      trigger={['click', 'click']}
      open={menuOpen}
      onOpenChange={handleOpenChange}
    >
      <AntAvatar
        style={{ backgroundColor: '#1677ff' }}
        size={32}
        icon={<RefreshCcw size={18} />}
      />
    </Popover>
  )
}
