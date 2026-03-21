import { useEffect, useState } from 'react'
import {
  useQuery,
} from '@tanstack/react-query'
import {
  MarkdownText
} from '@/common/components/markdown-text'
import { ChallengeService } from '@/services/challenge.service'
import { type Feedback, type Question, ChallengeType } from '@repo/shared-types'
import { useProgress } from '@/store/progress.store'
import { GenerationState } from './generation-state'
import { CodeArea } from '../../common/components/code-area'
import { useConfiguration, type Configuration } from '@/store/configuration.store'
import { Card } from '@/common/components/card'
import { getRandomTopicAndLevel } from '../utils/getRandomTopicAndLevel'
import { ChallengeTopbar } from './challenge-topbar'
import { ChallengeFeedback } from './challenge-feedback'
import { ChallengeReply } from './challenge-reply'
import { useReport } from '@/store/report.store'

export const Challenge = ({ level, topic, randomMode, storageMode }: Configuration) => {

  const [feedback, setFeedback] = useState<Feedback & { error?: string } | null>(null)
  const [isDisabled, setIsDisabled] = useState(true)
  const [canContinue, setCanContinue] = useState(false)
  const [localData, setLocalData] = useState<Question & { error?: string } | null>(null)
  const [previousQuestions, setPreviousQuestions] = useState<string[]>([])
  const [sessionToken, setSessionToken] = useState<string | null>(null)
  const [loadingEvaluation, setLoadingEvaluation] = useState(false)
  const [requestId, setRequestId] = useState(0)
  const [showRestart, setShowRestart] = useState<boolean>(false)
  const [topicAndLevel, setTopicAndLevel] = useState({ topic, level })

  const setConfiguration = useConfiguration(state => state.setConfiguration)

  const { score, stage } = useProgress(state => state.progress)
  const setProgress = useProgress(state => state.setProgress)
  const addToReport = useReport(state => state.addToReport)


  const { data, isFetching, isError, error } = useQuery({
    queryKey: ['question', requestId, topic, level],
    queryFn: () => ChallengeService.getChallenge(
      topicAndLevel,
      previousQuestions,
      sessionToken ?? undefined
    ),
    enabled: !!topicAndLevel.topic && !!topicAndLevel.level,
    staleTime: Infinity,
    refetchOnMount: 'always',
    refetchOnWindowFocus: false,
    refetchOnReconnect: false
  })

  const handleInputChange = (reply?: string) => {
    setIsDisabled(!reply)
  }

  const handleSubmit = async (reply: string) => {
    if (!reply) return

    setLoadingEvaluation(true)
    setIsDisabled(true)
    try {
      const result: Feedback = await ChallengeService.submitAnswer(
        data as Question,
        reply,
        topicAndLevel.level,
        sessionToken ?? undefined
      )

      setFeedback(result)

      setProgress({ score: score + result.score, stage: stage + 1 })

      if (localData) {
        const { question, initialCode, type } = localData
        addToReport({ challenge: { question, initialCode, type }, reply, evaluation: result })
      }
    } catch (error: any) {
      setFeedback({ error: error.error } as Feedback)
      setShowRestart(true)
    } finally {
      setLoadingEvaluation(false)
      setCanContinue(true)
    }
  }

  const loadNextQuestion = async () => {
    setLocalData(null)
    setFeedback(null)
    if (randomMode) {
      // random only once
      setConfiguration({
        topic: topicAndLevel.topic,
        level: topicAndLevel.level,
        randomMode: false
      })
    }
    setRequestId((current) => current + 1)
    setCanContinue(false)
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
  }, [isFetching])

  useEffect(() => {
    setSessionToken(null)
    setPreviousQuestions([])
    setFeedback(null)
    setLocalData(null)

    if (randomMode) {
      setTopicAndLevel(() => getRandomTopicAndLevel())
    }
  }, [])

  useEffect(() => {
    if (randomMode && isError && storageMode) {
      setTopicAndLevel(() => getRandomTopicAndLevel())
    }
  }, [isError, storageMode])

  return (
    <div className="flex flex-col h-screen p-4 align-self-center gap-4">
      <ChallengeTopbar
        isFetching={isFetching}
        canContinue={canContinue}
        disabled={isDisabled}
        showRestart={showRestart}
        onLoadNextQuestion={loadNextQuestion}
      />
      <div className="flex align-self-center gap-4 h-full">
        <div className="flex flex-col flex-1 basis-1/2">
          <Card>
            {(!localData || isFetching) && (
              <GenerationState isFetching={isFetching} />
            )}
            {localData?.error || error ? (
              <div><p>Error loading data</p>
                <pre className="whitespace-pre-wrap">
                  {JSON.stringify(localData?.error ?? error, null, 2)}
                </pre>
              </div>
            ) : null}
            {localData?.type === ChallengeType.Theoretical && (
              <MarkdownText content={localData?.question}/>
            )}
            {localData?.type === ChallengeType.Coding && (
              <>
              <MarkdownText content={localData?.question}/>
              <div className='grow min-h-0 relative mt-4'>
                  <CodeArea value={localData?.initialCode ?? ''} />
                </div>
              </>
            )}
          </Card>
        </div>
        <div className="flex flex-col basis-1/2 overflow-hidden">
          <Card>
            {loadingEvaluation && (
              <div><p>Loading evaluation...</p></div>
            )}
            {feedback && (<ChallengeFeedback feedback={feedback} />)}
            {shouldShowForm && <ChallengeReply onInputChange={handleInputChange} onSubmit={handleSubmit} type={localData?.type} />}
          </Card>
        </div>
      </div>
    </div>
  )
}
