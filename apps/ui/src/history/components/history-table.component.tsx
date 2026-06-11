import { ChallengeService } from '@/services/challenge.service'
import type { Feedback, Question } from '@repo/shared-types'
import { App, Table, Typography, type TableProps } from 'antd'
import { Trash2 } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { useMutation, useQueryClient } from '@tanstack/react-query'

type Row = Question & Feedback & { key: string }

interface HistoryTableProps {
  data: Row[]
}
export const HistoryTable = ({ data }: HistoryTableProps) => {
  const queryClient = useQueryClient()
  const navigate = useNavigate()
  const { message } = App.useApp()

  const selectChallenge = (id: string) => {
    navigate(`/?id=${id}`)
  }

  const deleteMutation = useMutation({
    mutationFn: ChallengeService.deleteQuestion,
    onMutate: async (id) => {
      // Cancel any outgoing refetches to avoid overwriting the optimistic update
      await queryClient.cancelQueries({ queryKey: ['all-challenges'] })

      const cached: {
        data: (Question & { sessionId: string } & Feedback)[]
        count: number
      } | undefined = queryClient.getQueryData(['all-challenges'])

      queryClient.setQueryData(['all-challenges'], () => {
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
    onError: (_) => {
      console.log(_)
      message.error('Error deleting the challenge')
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['all-challenges'] })
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
        <Typography.Link onClick={() => selectChallenge(record.id ?? '')}>
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
    },
    {
      title: 'Topic',
      dataIndex: 'topic',
      key: 'topic',
    },
    {
      title: 'Level',
      dataIndex: 'level',
      key: 'level',
    },
    {
      title: 'Score',
      dataIndex: 'score',
      key: 'score',
      align: 'center',
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
