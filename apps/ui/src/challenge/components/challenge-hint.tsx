import { ChallengeService } from '@/services/challenge.service'
import type { LevelType, Question } from '@repo/shared-types'
import { useQuery } from '@tanstack/react-query'
import { Badge, Button, Card } from 'antd'
import { type MouseEventHandler } from 'react'

export interface HintProps {
  data: Question
  level: LevelType | undefined
  reply: string
}
export const ChallengeHint = ({ data, reply, level }: HintProps) => {
  const cardStyles = { body: 'bg-orange-200 opacity-80 text-gray-900' }

  const {
    data: hint,
    refetch,
    isFetching,
    error: hintError,
  } = useQuery({
    queryKey: ['challenge-hint', data.id],
    queryFn: ({ signal }) => ChallengeService.getHint(signal, data, reply, level),
    enabled: false,
  })

  const getHint: MouseEventHandler<HTMLElement> = async (e) => {
    e.stopPropagation()
    refetch()
  }

  return (
    <>
      <div className="flex flex-row justify-between w-full align-center">
        <div className='flex flex-1'>
          {isFetching && <p className='bg-chart-3 pt-1 pl-2 mr-2 mb-2 rounded-sm text-background flex-1'>Loading hint...</p>}
          {hintError && <p className="pt-1 text-destructive">{hintError.message}</p>}
        </div>
        {!hint && (
          <Button
            type="primary"
            className="mr-2 mb-2 w-24 self-end"
            onClick={getHint}
            disabled={isFetching}
          >
            Need help?
          </Button>
        )}
      </div>
      {hint && (
        <div className="flex min-h-0 min-w-0 flex-col gap-2 overflow-y-auto pb-2 pr-2">
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
              {hint.text}
            </Card>
          </Badge.Ribbon>
        </div>
      )}
    </>
  )
}
