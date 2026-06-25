import { ChallengeService } from '@/services/challenge.service'
import { skipToken, useQuery } from '@tanstack/react-query'
import { useSearchParams } from 'react-router-dom'

export const useChallengeWithId = () => {

  const [searchParams] = useSearchParams()

  const id = searchParams.get('id')

  const { data: apiData, isPending, error } = useQuery({
    queryKey: ['challenge', 'from-history', id],
    queryFn: id ? () => ChallengeService.getChallengeWithId(id) : skipToken,
    retry: false
  })

  return {
    apiData, isPending, error
  }
}

