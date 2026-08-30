import { ChallengeService } from '@/services/challenge.service'
import {
  ChallengeType,
  RANDOM,
  type Feedback,
  type Question,
} from '@repo/shared-types'
import { App, Table, Typography, type TableProps } from 'antd'
import { Trash2 } from 'lucide-react'
import { useNavigate } from '@tanstack/react-router'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useConfiguration } from '@/store/configuration.store'

type Row = Question & Feedback & { key: string }

interface HistoryTableProps {
  data: Row[]
}
export const HistoryTable = ({ data }: HistoryTableProps) => {
  const queryClient = useQueryClient()
  const navigate = useNavigate()
  const { message } = App.useApp()
  const setConfiguration = useConfiguration((state) => state.setConfiguration)

  const selectChallenge = (row: Row) => {
    setConfiguration({
      topic: row.topic ?? RANDOM,
      level: row.level,
      type: row.type ?? ChallengeType.Mixed,
      randomMode: !row.topic && !row.level,
    })
    navigate({ to: '/', search: { id: row.id } })
  }

  const deleteMutation = useMutation({
    mutationFn: ChallengeService.deleteQuestion,
    onMutate: async (id) => {
      // Cancel any outgoing refetches to avoid overwriting the optimistic update
      await queryClient.cancelQueries({ queryKey: ['challenge', 'all'] })

      const cached:
        | {
            data: (Question & { sessionId: string } & Feedback)[]
            count: number
          }
        | undefined = queryClient.getQueryData(['challenge', 'all'])

      queryClient.setQueryData(['challenge', 'all'], () => {
        return {
          data: cached?.data?.filter((q) => q.id !== id),
          count: (cached?.count ?? 0) - 1,
        }
      })

      // Return a context object with the snapshotted value
      return { cached }
    },
    onSuccess: () => {
      message.success('Challenge deleted')
    },
    onError: () => {
      message.error('Error deleting the challenge')
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['challenge', 'all'] })
    },
  })

  const deleteRecord = (id: string) => {
    if (!id) return
    deleteMutation.mutate(id)
  }

  const columns: TableProps<Row>['columns'] = [
    {
      title: 'Question',
      dataIndex: 'question',
      key: 'question',
      render: (text, record) => (
        <Typography.Link onClick={() => selectChallenge(record ?? {})}>
          {text}
        </Typography.Link>
      ),
      ellipsis: true,
      width: '35%',
    },
    {
      title: 'Initial code',
      dataIndex: 'initialCode',
      key: 'initialCode',
      ellipsis: true,
      width: '35%',
      responsive: ['md'],
    },
    {
      title: 'Topic',
      dataIndex: 'topic',
      key: 'topic',
      ellipsis: true,
    },
    {
      title: 'Level',
      dataIndex: 'level',
      key: 'level',
      ellipsis: true,
    },
    {
      title: 'Score',
      dataIndex: 'score',
      key: 'score',
      align: 'center',
      ellipsis: true,
    },
    {
      key: 'delete',
      align: 'center',
      render: (_, record) => {
        return (
          <Trash2
            className="size-6 hover:text-red-600"
            onClick={() => deleteRecord(record.id ?? '')}
          />
        )
      },
    },
  ]

  return <Table columns={columns} dataSource={data} pagination={false} />
}
