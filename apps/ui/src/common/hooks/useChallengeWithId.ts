import { ChallengeService } from '@/services/challenge.service'
import { skipToken, useQuery } from '@tanstack/react-query'
import { useSearch } from '@tanstack/react-router'

export const useChallengeWithId = () => {

  const params = useSearch({ strict: false }) as { id?: string }

  const { data: apiData, isPending, error } = useQuery({
    queryKey: ['challenge', 'from-history', params.id],
    queryFn: params?.id ? () => ChallengeService.getChallengeWithId(params?.id ?? '') : skipToken,
    retry: false
  })

  return {
    apiData, isPending, error
  }
}

