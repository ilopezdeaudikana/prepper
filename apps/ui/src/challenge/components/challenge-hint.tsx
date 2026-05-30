import { Badge, Card } from 'antd'

export const ChallengeHint = ({ hint }: { hint: string }) => {
  const cardStyles = { body: 'bg-orange-200 opacity-80 text-gray-900' }
  return (
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
  )
}
