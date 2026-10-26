import { useState } from 'react'
import { MarkdownText } from '@/common/components/markdown-text'
import { type Feedback, type Question, ChallengeType } from '@repo/shared-types'
import { FINAL_STAGE, useProgress } from '@/store/progress.store'
import { GenerationState } from './generation-state'
import { useConfiguration } from '@/store/configuration.store'
import { Card } from 'antd'
import { ChallengeActions } from './challenge-actions'
import { ChallengeFeedback } from './challenge-feedback'
import { ChallengeReply } from './challenge-reply'
import { useNavigate, useSearch } from '@tanstack/react-router'
import { ChallengeEmpty } from './challenge-empty'
import { ChallengeHint } from './challenge-hint'
import { useChallengeWithId } from '@/common/hooks/useChallengeWithId'
import {
  useChallenge,
  extractQuestionFromLocalData,
} from '@/common/hooks/useChallenge'

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

  const params = useSearch({ strict: false }) as { id?: string }
  const navigate = useNavigate()

  const idParam = params?.id

  const [requestId, setRequestId] = useState(0)
  const { level, topic } = useConfiguration((state) => state.configuration)
  const { stage } = useProgress((state) => state.progress)

  const { apiData: challengeData } = useChallengeWithId()

  const {
    data,
    isFetching,
    error,
    submitMutation,
    loadingEvaluation,
    submitError,
    result,
    resetResult,
  } = useChallenge(requestId)

  const feedback = challengeData?.data.completed ? challengeData?.data : result

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

  const handleSubmit = async () => {
    if (!reply) return

    setIsDisabled(true)
    const question =
      (challenge as Question) ||
      (data as Question) ||
      extractQuestionFromLocalData()

    await submitMutation({ question, reply })
    setCanContinue(true)
  }

  const loadNextQuestion = () => {
    if (idParam) {
      void navigate({ to: '/', search: {} })
    }
    setRequestId((current) => current + 1)
    setCanContinue(false)
    reset()
  }

  const reset = () => {
    resetResult()
    setReply('')
  }

  const shouldShowResult = !!feedback || loadingEvaluation || submitError

  return (
    <div
      key={stage}
      className="flex h-[calc(100vh-90px)] min-h-0 flex-col gap-4 overflow-hidden"
    >
      <ChallengeActions
        isFetching={isFetching}
        canContinue={canContinue}
        disabled={isDisabled}
        idParam={idParam ?? null}
        showFinish={stage === FINAL_STAGE}
        onLoadNextQuestion={loadNextQuestion}
        onNavigate={reset}
      />
      <div className="flex flex-col min-h-0 min-w-0 flex-1 align-self-center gap-4 md:flex-row">
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
                {challenge &&
                  !challengeData?.data?.completed &&
                  !isFetching && (
                    <ChallengeHint
                      key={requestId}
                      data={
                        (data as Question) || extractQuestionFromLocalData()
                      }
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
                      disabled={challenge.completed}
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
        {shouldShowResult && (
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
                {submitError ? (
                  <div>
                    <p>Error loading data</p>
                    <pre className="whitespace-pre-wrap">
                      {JSON.stringify(submitError, null, 2)}
                    </pre>
                  </div>
                ) : null}
              </div>
            </Card>
          </div>
        )}
      </div>
    </div>
  )
}
