import { ChallengeService } from '@/services/challenge.service'
import type { Filters } from '@repo/shared-types'
import { useQuery } from '@tanstack/react-query'
import { useEffect } from 'react'
import { useNavigate, useSearch } from '@tanstack/react-router'

interface UseChallengeProps { page?: string, filters?: Filters }

export const useChallenges = ({ page, filters }: UseChallengeProps) => {

  const params = useSearch({ strict: false }) as { id?: string }

  const navigate = useNavigate()

  const id = params.id

  const { data: apiData, isPending, error } = useQuery({
    queryKey: ['challenge', 'all', page, ...Object.values(filters ?? {}), id],
    queryFn: () => ChallengeService.getChallenges(page!, filters),
    select: ({ data, count }) => {
      return {
        data: data.map(q => ({ ...q, key: q.id ?? '' })),
        count,
        topics: new Set(data.map(q => q.topic).filter(Boolean))
      }
    },
    staleTime: 2 * 1000 * 60,
    retry: false
  })


  useEffect(() => {
    if (error) {
      navigate({ to:'/' })
    }
  }, [error, navigate])

  return {
    apiData, isPending, error
  }
}

