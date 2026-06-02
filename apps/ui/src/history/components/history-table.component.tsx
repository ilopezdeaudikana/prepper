import type { Feedback, Question } from '@repo/shared-types'
import { Table, Typography, type TableProps } from 'antd'
import { useNavigate } from 'react-router-dom'


type Row = Question & Feedback & { key: string }

interface HistoryTableProps {
  data: Row[]
}
export const HistoryTable = ({
  data
}: HistoryTableProps) => {
  const navigate = useNavigate()


  const selectChallenge = (id: string) => {
    navigate(`/?id=${id}`)
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
  ]

  return <Table columns={columns} dataSource={data} pagination={false} />
}
