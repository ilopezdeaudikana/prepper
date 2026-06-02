import { ChallengeType, Level, type Filters } from '@repo/shared-types'
import { Pagination, Select } from 'antd'
import { useRef } from 'react'

interface HistoryFilterProps {
  onNextPage: (n: number) => void
  onFiltersChanged: (key: keyof Filters, value: string) => void
  total: number
  page: number
  topics: (string | undefined)[]
}
export const HistoryFilters = ({
  onNextPage,
  topics,
  total,
  page,
  onFiltersChanged,
}: HistoryFilterProps) => {

  const filters = useRef<Filters>({ completed: 'false', topic: undefined, level: undefined, type: undefined })
  
  const handlePageChange = (page: number) => {
    onNextPage(page ?? 0)
  }

  const handleFiltersChange = (key: keyof Filters, value: string) => {
    onFiltersChanged(key, value)
    console.log(value)
    filters.current = {...filters.current, [key]: value }
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-row justify-between w-full">
        <Select
          style={{ width: 150 }}
          value={filters.current.completed}
          onChange={(e) => handleFiltersChange('completed', e)}
          placeholder="Select complete/incomplete"
          options={[
            { value: 'true', label: 'Complete' },
            { value: 'false', label: 'Incomplete' },
          ]}
        />
        <Select
          style={{ width: 150 }}
          onChange={(e) => handleFiltersChange('type', e)}
          value={filters.current.type}
          placeholder="Select type"
          options={[
            { value: ChallengeType.Theoretical, label: 'Theoretical' },
            { value: ChallengeType.Coding, label: 'Coding' },
            { value: ChallengeType.Mixed, label: 'Mixed' },
          ]}
        />
        <Select
          style={{ width: 150 }}
          onChange={(e) => handleFiltersChange('level', e)}
          placeholder="Select level"
          value={filters.current.level}
          options={[
            { value: Level.Junior, label: 'Junior' },
            { value: Level.Mid, label: 'Mid' },
            { value: Level.Senior, label: 'Senior' },
          ]}
        />
        <Select
          style={{ width: 150 }}
          onChange={(e) => handleFiltersChange('topic', e)}
          placeholder="Select topic"
          value={filters.current.topic}
          options={topics.map((item) => ({ value: item, label: item }))}
        />
        <div className='w-120'>
          {total > 0 && <Pagination
            onChange={handlePageChange}
            total={total}
            pageSize={10}
            current={page + 1}
          />}
        </div>
      </div>
    </div>
  )
}
