import type { Feedback, Question } from '@repo/shared-types'
import { Pagination, Table, type TableProps, Typography, Button } from 'antd'
import { useNavigate } from 'react-router-dom'

type Row = Question & Feedback & { key: string }

interface HistoryTableProps {
  data: Row[],
  onNextPage: (n: number) => void,
  onChangeCompleted: (n: boolean) => void,
  total: number,
  page: number,
  completed: boolean
}
export const HistoryTable = ({ data, onNextPage, total, page, completed, onChangeCompleted }: HistoryTableProps) => {

  const navigate = useNavigate()

  const handleChange = (page: number) => {
    onNextPage(page ?? 0)
  }

  const selectChallenge = (id: string) => {
    navigate(`/?id=${id}&page=${page}&completed=${completed.toString()}`)
  }

  const columns: TableProps<Row>['columns'] = [
    {
      title: 'Question',
      dataIndex: 'question',
      key: 'question',
      render: (text, record) => <Typography.Link onClick={() => selectChallenge(record.id ?? '')}>{text}</Typography.Link>,
      ellipsis: true,
      width: '35%'
    },
    {
      title: 'Initial code',
      dataIndex: 'initialCode',
      key: 'initialCode',
      ellipsis: true,
      width: '35%'
    },
    {
      title: 'Topic',
      dataIndex: 'topic',
      key: 'topic'
    },
    {
      title: 'Level',
      dataIndex: 'level',
      key: 'level'
    },
    {
      title: 'Score',
      dataIndex: 'score',
      key: 'score',
      align: 'center'
    }
  ]

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-row justify-between w-full">
        <Button className="w-64" onClick={() => onChangeCompleted(!completed)}>
          Load only {completed ? 'unfinished' : 'completed'} challenges
        </Button>
        <Pagination onChange={handleChange} total={total} pageSize={10} current={page + 1} />
      </div>

      <Table columns={columns} dataSource={data} pagination={false} />
    </div>
  )
}
