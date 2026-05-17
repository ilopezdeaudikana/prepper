import { ChallengeService } from "@/services/challenge.service"
import type { Feedback, Question } from "@repo/shared-types"
import { useQuery } from "@tanstack/react-query"
import { useEffect, useRef, useState } from "react"
import { useNavigate, useSearchParams } from 'react-router-dom'

interface UseChallengeProps { page?: string, completed?: string }

export const useChallenges = ({ page, completed }: UseChallengeProps) => {

  const [searchParams, cleanParams] = useSearchParams()

  const navigate = useNavigate()

  const challengeFromHistory = useRef<Question & Feedback>(null)
  
  const [__, setTriggerRender] = useState(false)

  const [completedValue, setCompleted] = useState<string>()

  const [pageValue, setPage] = useState<string>()

  const { data: apiData, isPending, error } = useQuery({
    queryKey: ['all-challenges', pageValue, completedValue],
    queryFn: () => ChallengeService.getChallenges(pageValue!, completedValue!),
    select: ({ data, count }) => ({
      data: data.map(q => ({ ...q, key: q.id ?? '' })),
      count
    }),
    staleTime: 2 * 1000 * 60,
    enabled: !!pageValue && !!completedValue,
    retry: false
  })

  useEffect(() => {
    const id = searchParams.get('id')

    if (completedValue && pageValue && id) {
      const challenge = apiData?.data.find(item => item.id === id)
      if (challenge && challengeFromHistory) {
        challengeFromHistory.current = challenge
        setTriggerRender(true)
      }
    }
  }, [apiData])

  useEffect(() => {
    const completed = searchParams.get('completed')
    const page = searchParams.get('page')
    if (completed && page) {
      setCompleted(completed)
      setPage(page)
    }
  }, [searchParams])

  // pagination
  useEffect(() => {
    if (completed && page) {
      setCompleted(completed)
      setPage(page)
    }
  }, [completed, page])

  useEffect(() => {
    if (error) {
      cleanParams({})
      navigate('/')
    }
  }, [error])

  return {
    apiData, isPending, error, challengeFromHistory
  }
}