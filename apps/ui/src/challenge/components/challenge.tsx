import { useEffect, useState } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { MarkdownText } from '@/common/components/markdown-text'
import { ChallengeService } from '@/services/challenge.service'
import {
  type Feedback,
  type Question,
  ChallengeType,
  RANDOM,
} from '@repo/shared-types'
import { FINAL_STAGE, useProgress } from '@/store/progress.store'
import { GenerationState } from './generation-state'
import { CodeArea } from '../../common/components/code-area'
import { useConfiguration } from '@/store/configuration.store'
import { Card } from 'antd'
import { ChallengeTopbar } from './challenge-topbar'
import { ChallengeFeedback } from './challenge-feedback'
import { ChallengeReply } from './challenge-reply'
import { useReport } from '@/store/report.store'
import { useSearchParams } from 'react-router-dom'
import { ChallengeEmpty } from './challenge-empty'
import { ChallengeHint } from './challenge-hint'
import { useChallengeWithId } from '@/common/hooks/useChallengeWithId'

export const Challenge = () => {
  const [feedback, setFeedback] = useState<
    (Feedback & { error?: string }) | null
  >(null)
  const [isDisabled, setIsDisabled] = useState(true)
  const [reply, setReply] = useState('')
  const [canContinue, setCanContinue] = useState(false)
  const [challenge, setChallenge] = useState<
    (Question & Feedback & { error?: string; notice?: string }) | null
  >(null)
  const [previousQuestions, setPreviousQuestions] = useState<string[]>([])
  const [sessionToken, setSessionToken] = useState<string | null>(null)
  const [loadingEvaluation, setLoadingEvaluation] = useState(false)
  const [requestId, setRequestId] = useState(0)
  const { level, topic, type } = useConfiguration(
    (state) => state.configuration,
  )
  const setConfiguration = useConfiguration((state) => state.setConfiguration)
  const { score, stage } = useProgress((state) => state.progress)
  const setProgress = useProgress((state) => state.setProgress)
  const addToReport = useReport((state) => state.addToReport)

  const queryClient = useQueryClient()

  const { apiData: challengeData } = useChallengeWithId()

  const [searchParams, setSearchParams] = useSearchParams()

  const idParam = searchParams.get('id')

  const { data, isFetching, error } = useQuery({
    queryKey: ['question', requestId, topic, level],
    queryFn: () =>
      ChallengeService.createChallenge(
        { topic, level, type },
        previousQuestions,
        sessionToken ?? undefined,
      ),
    enabled: !!topic && !!level && !idParam,
    staleTime: Infinity,
    refetchOnMount: 'always',
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
  })

  const requestErrorMessage =
    challenge?.error ??
    (error instanceof Error
      ? error.message
      : error
        ? JSON.stringify(error, null, 2)
        : null)

  const handleInputChange = (reply?: string) => {
    setIsDisabled(!reply)
    setReply(reply ?? '')
  }

  const extractQuestionFromLocalData = () => {
    if (challenge) {
      const { question, initialCode, type, level, topic } = challenge
      return {
        question,
        initialCode,
        type,
        level,
        topic: topic ?? RANDOM,
      }
    }
  }

  const handleSubmit = async () => {
    if (!reply) return

    setLoadingEvaluation(true)
    setIsDisabled(true)

    try {
      const result: Feedback = await ChallengeService.submitAnswer(
        (data as Question) || extractQuestionFromLocalData(),
        reply,
        level,
        challenge?.sessionId,
        sessionToken ?? undefined,
      )

      setFeedback(result)

      setProgress({ score: score + (result.score ?? 0), stage: stage + 1 })

      if (challenge) {
        const { question, initialCode, type } = challenge
        addToReport({
          challenge: { question, initialCode, type },
          reply,
          evaluation: result,
        })
      }
      queryClient.invalidateQueries({ queryKey: ['all-challenges'] })
    } catch (error: any) {
      setFeedback({
        error: error?.error ?? error?.message ?? 'Evaluation failed.',
      } as Feedback)
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
    setChallenge(null)
    setFeedback(null)
    setReply('')
  }

  const shouldShowForm = feedback === null && !loadingEvaluation

  useEffect(() => {
    if (data?.sessionToken) {
      setSessionToken(data.sessionToken)
    }

    if (!data?.question) return
    setPreviousQuestions((current) =>
      current.includes(data.question) ? current : [...current, data.question],
    )

    setChallenge(data ?? null)
  }, [data])

  useEffect(() => {
    setSessionToken(null)
    setPreviousQuestions([])
    setFeedback(null)
    setChallenge(null)
  }, [])

  useEffect(() => {
    let active = true
    if (challengeData?.data && active) {
      const { topic, level, completed } = challengeData?.data
      setChallenge(challengeData?.data)
      if (completed) {
        setFeedback(challengeData?.data)
        setCanContinue(false)
      }
      setConfiguration({
        topic: topic ?? RANDOM,
        level,
        type,
        randomMode: !topic && !level,
      })
    } else if (!challengeData?.data && active) {
      setChallenge(null)
      setFeedback(null)
    }
    return () => {
      active = false
    }
  }, [challengeData])

  return (
    <div className="flex h-screen min-h-0 flex-col gap-4 overflow-hidden p-4 align-self-center">
      <ChallengeTopbar
        isFetching={isFetching}
        canContinue={canContinue}
        disabled={isDisabled}
        idParam={idParam}
        showFinish={stage === FINAL_STAGE}
        onLoadNextQuestion={loadNextQuestion}
        onNavigate={reset}
      />
      <div className="flex min-h-0 min-w-0 flex-1 align-self-center gap-4 overflow-hidden">
        <div className="flex min-h-0 min-w-0 flex-1 basis-0 flex-col">
          <Card
            className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden p-4"
            styles={{
              body: {
                display: 'flex',
                flexDirection: 'column',
                flexGrow: 1,
                maxHeight: '100%',
                minHeight: 0,
                minWidth: 0,
                overflow: 'auto',
              },
            }}
          >
            {challenge && !challengeData?.data?.completed && 
              <ChallengeHint 
                data={data as Question || extractQuestionFromLocalData()}
                level={level}
                reply={reply} 
            />}
          
            {!requestErrorMessage && (!challenge || isFetching) && (
              <GenerationState
                isFetching={isFetching}
                isReady={!!topic || !!level}
              />
            )}
            {requestErrorMessage ? (
              <div>
                <p>Error loading data</p>
                <pre className="whitespace-pre-wrap">{requestErrorMessage}</pre>
              </div>
            ) : null}
            {challenge?.notice ? (
              <div className="mb-4 rounded border border-amber-300 bg-amber-50 px-3 py-2 text-sm text-amber-900">
                {challenge.notice}
              </div>
            ) : null}
            {challenge?.type === ChallengeType.Theoretical && (
              <MarkdownText content={challenge?.question} />
            )}
            {challenge?.type === ChallengeType.Coding && (
              <>
                <MarkdownText content={challenge?.question} />
                <div className="grow min-h-0 relative mt-4">
                  <CodeArea
                    value={challenge?.initialCode ?? ''}
                    readOnly={true}
                    id="initial-code"
                  />
                </div>
              </>
            )}
            {!topic && !level && !idParam && (
              <ChallengeEmpty isQuestion={true} />
            )}
          </Card>
        </div>
        <div className="flex min-h-0 min-w-0 flex-1 basis-0 flex-col overflow-hidden">
          <Card
            className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden p-4"
            styles={{
              body: {
                display: 'flex',
                flexDirection: 'column',
                flexGrow: 1,
                minHeight: 0,
                minWidth: 0,
                overflow: 'auto',
              },
            }}
          >
            <div className="flex min-h-0 min-w-0 flex-1 flex-col">
              {loadingEvaluation && (
                <div>
                  <p>Loading evaluation...</p>
                </div>
              )}
              {feedback && <ChallengeFeedback feedback={feedback} />}
              {shouldShowForm && (
                <ChallengeReply
                  onInputChange={handleInputChange}
                  onSubmit={handleSubmit}
                  type={challenge?.type}
                />
              )}
              {!topic && !level && !idParam && (
                <ChallengeEmpty isQuestion={false} />
              )}
            </div>
          </Card>
        </div>
      </div>
    </div>
  )
}
