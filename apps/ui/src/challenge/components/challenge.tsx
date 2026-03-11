import { useEffect, useState } from 'react'
import {
  useQuery,
} from '@tanstack/react-query'

import {
  Message,
  MessageContent,
  MessageResponse
} from '@/components/ai-elements/message'

import { ChallengeService } from '@/services/challenge.service'
import { type Feedback, type Question, Topic } from '@repo/shared-types'
import { Badge } from '@/components/common/badge'
import { Textarea } from '@/components/common/textarea'
import { Button } from '@/components/common/button'
import { useProgress, FINAL_STAGE } from '@/store/progress.store'
import { GenerationState } from './generation-state'
import { CodeArea } from './code-area'
import type { Configuration } from '@/store/configuration.store'
import { Card } from '@/components/common/card'

export const Challenge = ({ level, topic, randomMode }: Omit<Configuration, 'storageMode'>) => {
  const SCORE = 7
  const [input, setInput] = useState<string>('')
  const [feedback, setFeedback] = useState<Feedback | null>(null)
  const [canContinue, setCanContinue] = useState(false)
  const [localData, setLocalData] = useState<Question & { error?: string } | null>(null)
  const [previousQuestions, setPreviousQuestions] = useState<string[]>([])
  const [sessionToken, setSessionToken] = useState<string | null>(null)
  const [loadingEvaluation, setLoadingEvaluation] = useState(false)
  const [requestId, setRequestId] = useState(0)
  const [showRestart, setShowRestart] = useState<boolean>(false)

  const { score, stage } = useProgress(state => state.progress)
  const setProgress = useProgress(state => state.setProgress)

  const levels = ['junior', 'mid', 'senior'] as const

  const getRandomValue = <T,>(arr: readonly T[]): T => {
    if (arr.length === 0) throw new Error('Cannot pick from an empty array')
    const index = Math.floor(Math.random() * arr.length)
    return arr[index]
  }

  const getRandomTopicAndLevel = () => ({
    topic: getRandomValue(Object.values(Topic)),
    level: getRandomValue(levels),
  })

  const [topicAndLevel, setTopicAndLevel] = useState(() =>
    randomMode ? getRandomTopicAndLevel() : { topic, level }
  )

  const { data, isFetching } = useQuery({
    queryKey: ['question', topicAndLevel.topic, topicAndLevel.level, requestId],
    queryFn: () => ChallengeService.getChallenge(
      topicAndLevel,
      previousQuestions,
      sessionToken ?? undefined
    ),
    staleTime: Infinity,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
    refetchOnMount: false,
  })

  const restart = () => {
    setProgress({ score: 0, stage: 0 })
  }

  const handleSubmit = async () => {
    if (!input) return
    setInput('')
    setLoadingEvaluation(true)
    try {
      const result: Feedback = await ChallengeService.submitAnswer(
        data as Question,
        input,
        topicAndLevel.level,
        sessionToken ?? undefined
      )

      setFeedback(result)

      if (result.score > SCORE) {
        setProgress({ score: score + result.score, stage: stage + 1 })
        setCanContinue(true)
      } else {
        setShowRestart(true)
      }
    } catch (error: any) {
      setFeedback(error.error)
    } finally {
      setLoadingEvaluation(false)
    }
  }

  const loadNextQuestion = async () => {
    if (stage === FINAL_STAGE) {
      // trigger redirection
      setProgress({ score, stage: FINAL_STAGE })
      return
    }
    setLocalData(null)
    setFeedback(null)
    if (randomMode) {
      setTopicAndLevel(getRandomTopicAndLevel())
    } else {
      setRequestId((current) => current + 1)
    }
    setCanContinue(false)
  }

  const shouldShowForm = feedback === null && !loadingEvaluation

  useEffect(() => setLocalData(data ?? null), [data])

  useEffect(() => {
    if (data?.sessionToken) {
      setSessionToken(data.sessionToken)
    }
  }, [data])

  useEffect(() => {
    if (!data?.question) return
    setPreviousQuestions((current) =>
      current.includes(data.question) ? current : [...current, data.question]
    )
  }, [data])

  useEffect(() => {
    setSessionToken(null)
    setPreviousQuestions([])
    setFeedback(null)
    setLocalData(null)
    setTopicAndLevel(randomMode ? getRandomTopicAndLevel() : { topic, level })
  }, [topic, level, randomMode])

  return (
    <div className="flex flex-col h-screen p-4 align-self-center gap-4 overflow-hidden">
      <Card
        className="h-[64px] flex-none"
      >
        <div className="flex justify-end gap-4">
          <Button form="reply-form" type="submit" disabled={!input} size='sm'>Submit</Button>
          {showRestart && <Button type="button" onClick={restart} size='sm'>
            Restart
          </Button>}
          {!showRestart && <Button type="button" onClick={loadNextQuestion} disabled={isFetching || !canContinue} size='sm'>
            {isFetching ? 'Loading...' : 'Next question'}
          </Button>}
        </div>
      </Card>

      <div className="flex align-self-center gap-4 flex-1 min-h-0 overflow-hidden">
        <div className="flex flex-col flex-1 basis-1/2 overflow-hidden min-h-0">
          <Card className="min-h-0 overflow-hidden">
            {(!localData || isFetching) && (
              <GenerationState isFetching={isFetching} />
            )}
            {localData?.error ? (
              <div><p>Error loading data</p><pre>{JSON.stringify(localData, null, 2)}</pre></div>
            ) : null}
            {localData?.type === 'theoretical' && (
              <Message
                from="assistant">
                <MessageContent>
                  <MessageResponse>{localData.question}</MessageResponse>
                </MessageContent>
              </Message>
            )}
            {localData?.type === 'coding' && (
              <Message className="flex-1 min-h-0 overflow-hidden" from="assistant">
                <MessageContent className="flex-1 min-h-0 overflow-hidden flex flex-col">
                  <MessageResponse
                    className='mb-4'
                  >
                    {localData.question}
                  </MessageResponse>
                  <CodeArea className="flex-1" code={localData.initialCode ?? ''} />
                </MessageContent>
              </Message>
            )}
          </Card>
        </div>
        <div className="flex flex-col basis-1/2 overflow-hidden min-h-0">
          <Card className="min-h-0 overflow-hidden">
            {loadingEvaluation && (
              <div><p>Loading evaluation...</p></div>
            )}
            {feedback && (
              <div className="flex flex-col gap-2 overflow-auto">
                {feedback.score && (
                  <p><Badge className="mr-2" color={feedback.score > SCORE ? 'green' : 'red'}>{feedback.score}</Badge></p>
                )}
                {feedback.critique && (
                  <Message
                    from="assistant"
                  >
                    <MessageContent>
                      <MessageResponse>{feedback.critique}</MessageResponse>
                    </MessageContent>
                  </Message>
                )}
                {feedback.improvedCode && (
                  <CodeArea className="flex-1" code={feedback.improvedCode} header='Improved Code' />
                )}
                {feedback.missedPoints && (
                  <Message
                    from="assistant"
                  >
                    <MessageContent>
                      {feedback.missedPoints.map((point, i) => (
                        <MessageResponse key={`missed-point-${i}`}>{point}</MessageResponse>))}
                    </MessageContent>
                  </Message>
                )}
              </div>
            )}
            {shouldShowForm && <form
              id="reply-form"
              onSubmit={(e) => { e.preventDefault(); handleSubmit() }}
              className="flex flex-col flex-1 min-h-0 overflow-hidden"
            >
              <div className="flex flex-col gap-2 flex-1 min-h-0 overflow-hidden">
                <span id="reply-label">Type your reply here:</span>
                {localData?.type === 'theoretical' && (<Textarea
                  name='reply'
                  onChange={(e) => setInput(e.target.value)}
                  className="min-h-25 mb-2 mt-4 flex-1"
                  aria-labelledby="reply-label"
                  value={input}
                />)}
                {localData?.type === 'coding' && (
                  <CodeArea
                    className="flex-1"
                    inputAriaLabelledBy="reply-label"
                    editable
                    code={input}
                    onEdit={(e: string) => setInput(e)}
                  />)}
              </div>
            </form>}
          </Card>
        </div>
      </div>
    </div>
  )
}
