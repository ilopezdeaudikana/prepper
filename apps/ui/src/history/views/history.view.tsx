import { HistoryTable } from '../components/history-table.component'
import { useState } from 'react'
import { Button } from 'antd'
import { useNavigate } from 'react-router-dom'
import { useChallenges } from '@/common/hooks/useChallenges'
import { Card } from 'antd'

export default function HistoryView() {

  const [completed, setCompleted] = useState(true)
  const [page, setPage] = useState<number>(0)

  const navigate = useNavigate()

  const { apiData, isPending, error } = useChallenges({ page: page.toString(), completed: completed.toString() })

  const handleNextPage = (n: number) => {
    setPage(n - 1)
  }

  const handleCompleted = (completed: boolean) => {
    setCompleted(completed)
  }

  return (
    <div className="p-4 align-self-center flex flex-col h-screen">
      <Card className="flex-1">
        <div className="flex flex-col gap-4">
          <Button type="primary" className="w-48" onClick={() => navigate('/')}>
            Back to challenges view
          </Button>
          {apiData &&
            <HistoryTable
              data={apiData.data}
              total={apiData.count}
              onNextPage={handleNextPage}
              page={page}
              onChangeCompleted={handleCompleted}
              completed={completed}
            />}
          {isPending && <p>Loading challenges...</p>}
          {error && <p>Error loading challenges, please try again later.</p>}
        </div>
      </Card>
    </div>
  )
}
