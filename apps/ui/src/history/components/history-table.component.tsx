import { ChallengeService } from '@/services/challenge.service'
import type { Feedback, Question } from '@repo/shared-types'
import { App, Table, Typography, type TableProps } from 'antd'
import { Trash2 } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { useQueryClient } from '@tanstack/react-query'

type Row = Question & Feedback & { key: string }

interface HistoryTableProps {
  data: Row[]
}
export const HistoryTable = ({ data }: HistoryTableProps) => {
  const client = useQueryClient()
  const navigate = useNavigate()
  const { message } = App.useApp()

  const selectChallenge = (id: string) => {
    navigate(`/?id=${id}`)
  }

  const deleteRecord = (id: string) => {
    if (!id) return
    try {
      ChallengeService.deleteQuestion(id)
        message.success('Challenge deleted')
      client.invalidateQueries({ queryKey: ['all-challenges'] })
    } catch (_) {
      message.error('Error deleting the challenge')
    }
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
