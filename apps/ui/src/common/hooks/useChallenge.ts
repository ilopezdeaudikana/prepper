import { useProgress } from '@/store/progress.store'
import { ChallengeService } from '@/services/challenge.service'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useSearch } from '@tanstack/react-router'
import { useReport } from '@/store/report.store'
import { useConfiguration } from '@/store/configuration.store'
import { RANDOM, type Feedback, type Question } from '@repo/shared-types'
import { useEffect, useRef } from 'react'


export const extractQuestionFromLocalData = (challenge?: Question) => {
  if (challenge) {
    const { id, sessionId, question, initialCode, type, level, topic } =
      challenge
    return {
      id,
      sessionId,
      question,
      initialCode,
      type,
      level,
      topic: topic ?? RANDOM,
    }
  }
}

export const useChallenge = (requestId: number) => {

  const queryClient = useQueryClient()
  const previousQuestions = useRef<string[]>([])
  const sessionToken = useRef<string>(undefined)
  const params = useSearch({ strict: false }) as { id?: string }

  const idParam = params?.id
  const { level, topic, type } = useConfiguration(
    (state) => state.configuration,
  )
  const { score, stage } = useProgress((state) => state.progress)
  const setProgress = useProgress((state) => state.setProgress)
  const addToReport = useReport((state) => state.addToReport)
  const { data, isFetching, error } = useQuery({
    queryKey: ['challenge', requestId, topic, level, type, idParam],
    queryFn: ({
      signal,
    }): Promise<
      Question &
      Feedback & { error?: string; notice?: string; sessionToken?: string }
    > =>
      ChallengeService.createChallenge(
        { topic, level, type },
        previousQuestions.current,
        sessionToken.current ?? undefined,
        signal,
      ),
    enabled: !!topic && !!level && !idParam,
    staleTime: Infinity,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
    placeholderData: (previousData) => previousData,
  })

  const {
    data: result,
    mutateAsync: submitMutation,
    isPending: loadingEvaluation,
    error: submitError,
    reset: resetResult
  } = useMutation({
    mutationFn: ({ question, reply }: { question: Question; reply: string }) =>
      ChallengeService.submitAnswer(
        question,
        reply,
        level,
        sessionToken.current ?? undefined,
      ),
    onSuccess: (result, variables) => {
      setProgress({ score: score + (result.score ?? 0), stage: stage + 1 })
      queryClient.invalidateQueries({ queryKey: ['challenge', 'all'] })
      
        const { question, initialCode, type } = variables.question
        addToReport({
          challenge: { question, initialCode, type },
          reply: variables.reply,
          evaluation: result,
        })

    },
  })

  useEffect(() => {
    if (data?.question) {
      previousQuestions.current = previousQuestions.current.includes(
        data.question,
      )
        ? previousQuestions.current
        : [...previousQuestions.current, data.question]
    }
    if (data?.sessionToken) {
      sessionToken.current = data.sessionToken
    }
  }, [data?.question, data?.sessionToken])
  return {
    data, result, isFetching, error, loadingEvaluation, submitMutation, submitError, resetResult
  }
}

