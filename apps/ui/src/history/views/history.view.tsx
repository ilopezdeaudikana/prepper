import { HistoryTable } from '../components/history-table.component'
import { useState } from 'react'
import { Button } from 'antd'
import { useNavigate } from 'react-router-dom'
import { useChallenges } from '@/common/hooks/useChallenges'
import { Card } from 'antd'
import { HistoryFilters } from '../components/history-filters.component'
import type { Filters } from '@repo/shared-types'

export default function HistoryView() {
  const [filters, setFilters] = useState<Filters | undefined>({
    type: undefined,
    level: undefined,
    completed: 'false',
    topic: undefined,
  })

  const [page, setPage] = useState<number>(0)

  const navigate = useNavigate()

  const { apiData, isPending, error } = useChallenges({
    page: page.toString(),
    filters,
  })

  const handleNextPage = (n: number) => {
    setPage(n - 1)
  }

  const handleFiltersChange = (key: keyof Filters, value: string) => {
    setFilters(
      (filters) =>
        ({
          ...(filters ?? {}),
          [key]: value,
        }) as Filters,
    )
  }

  return (
    <div className="p-4 align-self-center flex flex-col h-screen">
      <Card className="flex-1" styles={{ body: { padding: '1.25rem' } }}>
        <div className="flex flex-col gap-4">
          <Button type="primary" className="w-48" onClick={() => navigate('/')}>
            Back to challenges view
          </Button>
          <HistoryFilters
            onNextPage={handleNextPage}
            onFiltersChanged={handleFiltersChange}
            page={page}
            total={apiData?.count ?? 0}
            topics={Array.from(apiData?.topics ?? [])}
          />
          {apiData && <HistoryTable data={apiData.data} />}
          {isPending && <p>Loading challenges...</p>}
          {error && <p>Error loading challenges, please try again later.</p>}
        </div>
      </Card>
    </div>
  )
}
