import { useEffect, useRef, useState } from 'react'
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
import { useConfiguration } from '@/store/configuration.store'
import { Card } from 'antd'
import { ChallengeActions } from './challenge-actions'
import { ChallengeFeedback } from './challenge-feedback'
import { ChallengeReply } from './challenge-reply'
import { useReport } from '@/store/report.store'
import { useParams, useSearch } from '@tanstack/react-router'
import { ChallengeEmpty } from './challenge-empty'
import { ChallengeHint } from './challenge-hint'
import { useChallengeWithId } from '@/common/hooks/useChallengeWithId'

const cardBody: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  flexGrow: 1,
  maxHeight: '99%',
  minHeight: 0,
  minWidth: 0,
  overflow: 'hidden',
  padding: '1.25rem',
}

export const Challenge = () => {
  const [isDisabled, setIsDisabled] = useState(true)
  const [reply, setReply] = useState('')
  const [canContinue, setCanContinue] = useState(false)

  const params = useSearch({ strict: false })

  const idParam = params?.id

  const previousQuestions = useRef<string[]>([])
  const [loadingEvaluation, setLoadingEvaluation] = useState(false)
  const [requestId, setRequestId] = useState(0)
  const { level, topic, type } = useConfiguration(
    (state) => state.configuration,
  )
  const { score, stage } = useProgress((state) => state.progress)
  const setProgress = useProgress((state) => state.setProgress)
  const addToReport = useReport((state) => state.addToReport)

  const queryClient = useQueryClient()

  const { apiData: challengeData } = useChallengeWithId()

  const [feedback, setFeedback] = useState<
    (Feedback & { error?: string }) | null
  >(challengeData?.data.completed ? challengeData?.data : null)

  const { data, isFetching, error } = useQuery({
    queryKey: ['challenge', requestId, topic, level],
    queryFn: (): Promise<
      Question &
        Feedback & { error?: string; notice?: string; sessionToken?: string }
    > =>
      ChallengeService.createChallenge(
        { topic, level, type },
        previousQuestions.current,
        sessionToken ?? undefined,
      ),
    enabled: !!topic && !!level && !idParam,
    staleTime: Infinity,
    refetchOnMount: 'always',
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
    placeholderData: (previousData) => previousData,
  })

  const sessionToken = data?.sessionToken ?? null

  const challenge: (Question & Feedback & { notice?: string }) | undefined =
    challengeData?.data ? challengeData?.data : isFetching ? undefined : data

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

  const handleSubmit = async () => {
    if (!reply) return

    setLoadingEvaluation(true)
    setIsDisabled(true)

    try {
      const result: Feedback = await ChallengeService.submitAnswer(
        (challenge as Question) ||
          (data as Question) ||
          extractQuestionFromLocalData(),
        reply,
        level,
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
      queryClient.invalidateQueries({ queryKey: ['challenge', 'all'] })
    } catch (error: unknown) {
      setFeedback({
        error: (error as Error).message ?? 'Evaluation failed.',
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
    // setSearchParams({})
    setFeedback(null)
    setReply('')
  }

  useEffect(() => {
    if (data?.question) {
      previousQuestions.current = previousQuestions.current.includes(
        data.question,
      )
        ? previousQuestions.current
        : [...previousQuestions.current, data.question]
    }
  }, [data?.question])

  const shouldShowForm = feedback === null && !loadingEvaluation

  return (
    <div className="flex h-[calc(100vh-90px)] min-h-0 flex-col gap-4 overflow-hidden">
      <ChallengeActions
        isFetching={isFetching}
        canContinue={canContinue}
        disabled={isDisabled}
        idParam={idParam}
        showFinish={stage === FINAL_STAGE}
        onLoadNextQuestion={loadNextQuestion}
        onNavigate={reset}
      />
      <div className="flex min-h-0 min-w-0 flex-1 align-self-center gap-4">
        <div className="flex min-h-0 min-w-0 flex-1 basis-0 flex-col transition-all duration-500 ease-in-out">
          <Card
            className="flex flex-col flex-1"
            styles={{
              body: cardBody,
            }}
          >
            {!topic && !level && !idParam ? (
              <ChallengeEmpty isQuestion={true} />
            ) : (
              <>
                {challenge && !challengeData?.data?.completed && (
                  <ChallengeHint
                    data={(data as Question) || extractQuestionFromLocalData()}
                    level={level}
                    reply={reply}
                  />
                )}

                {!requestErrorMessage && (!challenge || isFetching) && (
                  <GenerationState
                    isFetching={isFetching}
                    isReady={!!topic || !!level}
                  />
                )}
                {requestErrorMessage ? (
                  <div>
                    <p>Error loading data</p>
                    <pre className="whitespace-pre-wrap">
                      {requestErrorMessage}
                    </pre>
                  </div>
                ) : null}
                {challenge?.notice ? (
                  <div className="mb-4 rounded border border-amber-300 bg-amber-50 px-3 py-2 text-sm text-amber-900">
                    {challenge.notice}
                  </div>
                ) : null}
                {challenge?.type === ChallengeType.Theoretical && (
                  <>
                    <MarkdownText content={challenge?.question} />
                    <ChallengeReply
                      onInputChange={handleInputChange}
                      disabled={!shouldShowForm}
                      onSubmit={handleSubmit}
                      type={ChallengeType.Theoretical}
                    />
                  </>
                )}
                {challenge?.type === ChallengeType.Coding && (
                  <>
                    <MarkdownText content={challenge?.question} />
                    <ChallengeReply
                      defaultValue={challenge?.initialCode ?? ''}
                      onInputChange={handleInputChange}
                      onSubmit={handleSubmit}
                      type={ChallengeType.Coding}
                    />
                  </>
                )}
              </>
            )}
          </Card>
        </div>
        {!shouldShowForm && (
          <div className="flex min-h-0 min-w-0 flex-1 basis-0 flex-col transition-all duration-500 ease-in-out">
            <Card
              className="flex min-h-0 min-w-0 flex-1 flex-col p-4"
              styles={{
                body: cardBody,
              }}
            >
              <div className="flex min-h-0 min-w-0 flex-1 flex-col">
                {loadingEvaluation && (
                  <div>
                    <p>Loading evaluation...</p>
                  </div>
                )}
                {feedback && <ChallengeFeedback feedback={feedback} />}
              </div>
            </Card>
          </div>
        )}
      </div>
    </div>
  )
}
