import { UserService } from '@/services/user.service'
import { useUser } from '@/store/user.store'
import {
  Avatar as AntAvatar,
  App,
  Button,
  Card,
  Flex,
  Input,
  Popover,
  Typography,
} from 'antd'
import { RefreshCcw } from 'lucide-react'
import { useState } from 'react'

export const Avatar = ({ isPublic }: { isPublic: boolean }) => {
  const [inFlight, setInFlight] = useState(false)
  const [hasCopied, setHasCopied] = useState(false)

  const session = useUser((state) => state.session)
  const hasPhrase = useUser((state) => state.recoveryPhrase)

  const [phrase, setPhrase] = useState<string>()
  const [alternativePhrase, setAlternativePhrase] = useState<string>()

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
      const result = await UserService.sendRecoveryPhrase(
        session,
        alternativePhrase,
      )
      setPhrase(result.recoveryPhrase)
    } catch (error) {
      message.error('Error generating recovery phrase')
    } finally {
      setInFlight(false)
    }
  }

  const handleCopy = () => {
    setHasCopied(true)
  }

  const handleInputChange: React.ChangeEventHandler<HTMLInputElement, HTMLInputElement> = (e) => {
    setAlternativePhrase(e.target.value)
  }
  
  const content = (
    <Flex vertical gap={12} style={{ width: '25rem' }}>
      <Typography>
        We don't collect emails or personal data, which means your progress is
        stored entirely in this browser. To access your data from another device
        or protect it from being cleared, generate or insert a Recovery Phrase.
      </Typography>

      {!hasPhrase && !hasCopied && (
        <Button
          type="primary"
          disabled={inFlight || isPublic}
          onClick={generatePhrase}
        >
          Generate Recovery Phrase
        </Button>
      )}

      {(hasPhrase || hasCopied) && (
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
      {phrase && (
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
    </Flex>
  )

  return (
    <Popover
      placement="bottom"
      title="Save progress"
      content={content}
      trigger={['click', 'click']}
    >
      <AntAvatar
        style={{ backgroundColor: '#1677ff' }}
        size={32}
        icon={<RefreshCcw size={18} />}
      />
    </Popover>
  )
}
