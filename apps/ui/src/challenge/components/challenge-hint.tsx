import { ChallengeService } from '@/services/challenge.service'
import type { LevelType, Question } from '@repo/shared-types'
import { Badge, Button, Card } from 'antd'
import { useEffect, useState, type MouseEventHandler } from 'react'

export interface HintProps {
  data: Question
  level: LevelType | undefined
  reply: string
}
export const ChallengeHint = ({ data, reply, level }: HintProps) => {
  const cardStyles = { body: 'bg-orange-200 opacity-80 text-gray-900' }
  const [hint, setHint] = useState('')
  const [hintError, setHintError] = useState('')

  const getHint: MouseEventHandler<HTMLElement> = async (e) => {
    e.stopPropagation()

    try {
      const result = await ChallengeService.getHint(
        data,
        reply,
        level,
      )

      setHint(result.text ?? '')
    } catch (error: any) {
      setHintError(error?.error ?? error?.message ?? 'Hint generation failed.')
    }
  }

  useEffect(() => () => setHint(''), [])

  return (
    <>
      {!hint && (
        <Button
          type="primary"
          className="mr-2 mb-2 w-24 self-end"
          onClick={getHint}
        >
          Need help?
        </Button>
      )}
      {hint && (
        <div className="flex min-w-0 max-w-full flex-col gap-2 overflow-hidden py-2 pr-2">
          <Badge.Ribbon text="Hint">
            <Card
              title="Missing bits"
              size="small"
              className="min-w-0 max-w-full"
              classNames={cardStyles}
              styles={{
                body: {
                  overflowWrap: 'anywhere',
                  whiteSpace: 'pre-wrap',
                  wordBreak: 'break-word',
                },
                header: {
                  background: 'var(--color-orange-200)',
                  fontWeight: 200,
                  fontSize: 'var(--text-base)',
                  color: 'var(--color-gray-700)',
                },
              }}
            >
              {hint}
            </Card>
          </Badge.Ribbon>
        </div>
      )}
      {hintError && <p className="text-red-500">{hintError}</p>}
    </>
  )
}
