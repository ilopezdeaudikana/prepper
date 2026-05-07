import { useEffect, useState } from 'react'
import {
  useQuery,
  useQueryClient,
} from '@tanstack/react-query'
import {
  MarkdownText
} from '@/common/components/markdown-text'
import { ChallengeService } from '@/services/challenge.service'
import { type Feedback, type Question, ChallengeType, RANDOM } from '@repo/shared-types'
import { FINAL_STAGE, useProgress } from '@/store/progress.store'
import { GenerationState } from './generation-state'
import { CodeArea } from '../../common/components/code-area'
import { useConfiguration } from '@/store/configuration.store'
import { Card } from 'antd'
import { ChallengeTopbar } from './challenge-topbar'
import { ChallengeFeedback } from './challenge-feedback'
import { ChallengeReply } from './challenge-reply'
import { useReport } from '@/store/report.store'
import { useChallenges } from '@/common/hooks/useChallenges'
import { useSearchParams } from 'react-router-dom'
import { ChallengeEmpty } from './challenge-empty'

export const Challenge = () => {

  const [feedback, setFeedback] = useState<Feedback & { error?: string } | null>(null)
  const [isDisabled, setIsDisabled] = useState(true)
  const [canContinue, setCanContinue] = useState(false)
  const [localData, setLocalData] = useState<(Question & Feedback & { error?: string, notice?: string }) | null>(null)
  const [previousQuestions, setPreviousQuestions] = useState<string[]>([])
  const [sessionToken, setSessionToken] = useState<string | null>(null)
  const [loadingEvaluation, setLoadingEvaluation] = useState(false)
  const [requestId, setRequestId] = useState(0)
  const { level, topic } = useConfiguration(state => state.configuration)
  const setConfiguration = useConfiguration(state => state.setConfiguration)
  const { score, stage } = useProgress(state => state.progress)
  const setProgress = useProgress(state => state.setProgress)
  const addToReport = useReport(state => state.addToReport)

  const queryClient = useQueryClient()
  
  const { currentChallenge } = useChallenges({})

  const [searchParams, setSearchParams] = useSearchParams()

  const idParam = searchParams.get('id')

  const { data, isFetching, error } = useQuery({
    queryKey: ['question', requestId, topic, level],
    queryFn: () => ChallengeService.getChallenge(
      { topic, level },
      previousQuestions,
      sessionToken ?? undefined
    ),
    enabled: !!topic && !!level && !idParam,
    staleTime: Infinity,
    refetchOnMount: 'always',
    refetchOnWindowFocus: false,
    refetchOnReconnect: false
  })

  const requestErrorMessage =
    localData?.error ??
    (error instanceof Error ? error.message : error ? JSON.stringify(error, null, 2) : null)

  const handleInputChange = (reply?: string) => {
    setIsDisabled(!reply)
  }

  const extractQuestionFromLocalData = () => {
    if (localData) {
      const { question, initialCode, type, level, topic } = localData
      return {
        question,
        initialCode,
        type,
        level: level ?? RANDOM,
        topic: topic ?? RANDOM
      }
    }
  }
  const handleSubmit = async (reply: string) => {
    if (!reply) return

    setLoadingEvaluation(true)
    setIsDisabled(true)

    try {
      const result: Feedback = await ChallengeService.submitAnswer(
        data as Question || extractQuestionFromLocalData(),
        reply,
        level,
        localData?.sessionId,
        sessionToken ?? undefined
      )

      setFeedback(result)

      setProgress({ score: score + (result.score ?? 0), stage: stage + 1 })

      if (localData) {
        const { question, initialCode, type } = localData
        addToReport({ challenge: { question, initialCode, type }, reply, evaluation: result })
      }
      queryClient.invalidateQueries({ queryKey: ['all-challenges'] })

    } catch (error: any) {
      setFeedback({ error: error?.error ?? error?.message ?? 'Evaluation failed.' } as Feedback)
    } finally {
      setLoadingEvaluation(false)
      setCanContinue(true)
    }
  }

  const loadNextQuestion = async () => {
    setRequestId((current) => current + 1)
    setCanContinue(false)
    reset()
  }

  const reset = () => {
    setSearchParams({})
    currentChallenge.current = null
    setLocalData(null)
    setFeedback(null)
  }

  const shouldShowForm = feedback === null && !loadingEvaluation

  useEffect(() => {
    if (data?.sessionToken) {
      setSessionToken(data.sessionToken)
    }

    if (!data?.question) return
    setPreviousQuestions((current) =>
      current.includes(data.question) ? current : [...current, data.question]
    )

    setLocalData(data ?? null)
  }, [data])

  useEffect(() => {
    setSessionToken(null)
    setPreviousQuestions([])
    setFeedback(null)
    setLocalData(null)
  }, [])

  useEffect(() => {
    let active = true

    if (currentChallenge.current && active) {
      const { topic, level, completed } = currentChallenge.current
      setLocalData(currentChallenge.current)
      if (completed) setFeedback(currentChallenge.current)
      setConfiguration({
        topic: topic ?? RANDOM,
        level: level ?? RANDOM,
        randomMode: !topic && !level
      })
    } else if (!currentChallenge.current && active) {
      setLocalData(null)
      setFeedback(null)
    }
    return () => {
      active = false
    }
  }, [currentChallenge.current])

  return (
    <div className="flex flex-col h-screen p-4 align-self-center gap-4">
      <ChallengeTopbar
        isFetching={isFetching}
        canContinue={canContinue}
        disabled={isDisabled}
        showFinish={stage === FINAL_STAGE}
        onLoadNextQuestion={loadNextQuestion}
        onNavigate={reset}
      />
      <div className="flex align-self-center gap-4 h-full min-w-0">
        <div className="flex min-w-0 flex-1 basis-1/2 flex-col">
          <Card
            className="flex flex-col flex-1 p-4 overflow-auto"
            styles={{ body: { display: 'flex', flexDirection: 'column', flexGrow: 1 } }}
          >
            {!requestErrorMessage && (!localData || isFetching) && (
              <GenerationState isFetching={isFetching} isReady={!!topic || !!level} />
            )}
            {requestErrorMessage ? (
              <div><p>Error loading data</p>
                <pre className="whitespace-pre-wrap">
                  {requestErrorMessage}
                </pre>
              </div>
            ) : null}
            {localData?.notice ? (
              <div className="mb-4 rounded border border-amber-300 bg-amber-50 px-3 py-2 text-sm text-amber-900">
                {localData.notice}
              </div>
            ) : null}
            {localData?.type === ChallengeType.Theoretical && (
              <MarkdownText content={localData?.question} />
            )}
            {localData?.type === ChallengeType.Coding && (
              <>
                <MarkdownText content={localData?.question} />
                <div className='grow min-h-0 relative mt-4'>
                  <CodeArea value={localData?.initialCode ?? ''} readOnly={false} id="initial-code" />
                </div>
              </>
            )}
            {!topic && !level && <ChallengeEmpty isQuestion={true}/>}
          </Card>
        </div>
        <div className="flex min-w-0 basis-1/2 flex-col overflow-hidden">
          <Card
            className="flex flex-col flex-1 p-4 overflow-auto"
            styles={{ body: { display: 'flex', flexDirection: 'column', flexGrow: 1 } }}
          >
            <div className="flex flex-col flex-1">
              {loadingEvaluation && (
                <div><p>Loading evaluation...</p></div>
              )}
              {feedback && (<ChallengeFeedback feedback={feedback} />)}
              {shouldShowForm && <ChallengeReply onInputChange={handleInputChange} onSubmit={handleSubmit} type={localData?.type} />}
              {!topic && !level && <ChallengeEmpty isQuestion={false}/>}
            </div>
          </Card>
        </div>
      </div>
    </div>
  )
}
