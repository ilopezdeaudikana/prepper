import { useEffect, useState } from 'react'
import {
  useQuery
} from '@tanstack/react-query'

import {
  Message,
  MessageContent,
  MessageResponse
} from '@/components/ai-elements/message'

import {
  CodeBlock,
  CodeBlockActions,
  CodeBlockCopyButton,
  CodeBlockHeader
} from "@/components/ai-elements/code-block"

import { ChallengeService } from '@/services/challenge.service'

import type { Feedback, Question, } from '@/mastra/agents/interview-agent'
import { Badge } from '@/components/ui/badge'
import { Textarea } from '@/components/ui/textarea'
import { Button } from '@/components/ui/button'
import { useConfiguration } from '@/store/configuration.store'
import { useProgress } from '@/store/progress.store'
import { useNavigate } from 'react-router-dom'

export default function Challenge() {
  const navigate = useNavigate()

  const [input, setInput] = useState<string>('')
  const [feedback, setFeedback] = useState<Feedback | null>(null)
  const [canContinue, setCanContinue] = useState(false)
  const [localData, setLocalData] = useState<Question & { error?: string } | null>(null)
  const [loadingEvaluation, setLoadingEvaluation] = useState(false)

  const configuration = useConfiguration(state => state.configuration)

  const { score, stage } = useProgress(state => state.progress)
  const setProgress = useProgress(state => state.setProgress)

  const { data, refetch, isFetching } = useQuery({
    queryKey: ['question'],
    queryFn: () => ChallengeService.getChallenge(configuration.topic, configuration.level),
    enabled: Boolean(configuration.topic && configuration.level),
    staleTime: Infinity,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
    refetchOnMount: false,
  })

  const handleCopy = () => {
    console.log('Copied code to clipboard')
  }

  const handleCopyError = () => {
    console.error('Failed to copy code to clipboard')
  }

  const handleSubmit = async () => {
    if (!input) return

    setLoadingEvaluation(true)
    const result: Feedback = await ChallengeService.submitAnswer(data as Question, input, configuration.level)
    setFeedback(result)
    setInput('')
    setLoadingEvaluation(false)

    if (result.score > 7.5) {
      if (stage === 5) {
        setProgress({ score: score + result.score, stage: 5 })
        navigate('/finale')
        return
      } else {
        setProgress({ score: score + result.score, stage: stage + 1 })
        setCanContinue(true)
      }
    }
  }

  const loadNextQuestion = async () => {
    setLocalData(null)
    setFeedback(null)
    await refetch()
    setCanContinue(false)
  }
  
  useEffect(() => setLocalData(data ?? null), [data])

  return (
    <div className="max-w-9/10 flex h-screen flex-col mx-auto p-4 relative align-self-center gap-4">
      <div className="flex-1 min-h-0 overflow-y-auto">
        {!localData ||isFetching && (
          <div><p>Loading...</p></div>
        )}
        {localData?.error ? (
          <div><p>Error loading data</p><pre>{JSON.stringify(localData, null, 2)}</pre></div>
        ) : null}
        {localData?.type === 'theoretical' && (
          <Message
            from="system">
            <MessageContent>
              <MessageResponse>{localData.question}</MessageResponse>
            </MessageContent>
          </Message>
        )}
        {localData?.type === 'coding' && (
          <Message
            from="system">
            <MessageContent>
              <MessageResponse
                className='mb-4'
              >{localData.question}</MessageResponse>
              <CodeBlock code={localData.initialCode ?? ''} language="javascript">
                <CodeBlockHeader>
                  <CodeBlockActions>
                    <CodeBlockCopyButton onCopy={handleCopy} onError={handleCopyError} />
                  </CodeBlockActions>
                </CodeBlockHeader>
              </CodeBlock>
            </MessageContent>
          </Message>
        )}
      </div>
      <div className="shrink-0 flex flex-col">
        {loadingEvaluation && (
          <div><p>Loading evaluation...</p></div>
        )}
        {feedback && (
          <div className="mt-2 max-h-[40vh] overflow-y-auto pr-1">
            {feedback.score && (
              <p><Badge className="mr-2" color={feedback.score > 7.5 ? 'green' : 'red'}>{feedback.score}</Badge></p>
            )}
            {feedback.critique && (
              <p>{feedback.critique}</p>
            )}
            {feedback.improvedCode && (
              <CodeBlock code={feedback.improvedCode} language="javascript">
                <CodeBlockHeader>Improved Code</CodeBlockHeader>
                <CodeBlockActions>
                  <CodeBlockCopyButton onCopy={handleCopy} onError={handleCopyError} />
                </CodeBlockActions>
              </CodeBlock>
            )}
            {feedback.missedPoints && feedback.missedPoints.map((point, i) => (
              <p key={`missed-point-${i}`}>{point}</p>
            ))}
          </div>
        )}
        <form onSubmit={(e) => { e.preventDefault(); handleSubmit() }}>
          <div className="flex flex-col mb-2 gap-2">
            <Textarea
              onChange={(e) => setInput(e.target.value)}
              className="min-h-25 mb-2 mt-4"
              value={input}
            />
            <Button type="submit" disabled={!input}>Submit</Button>
            <Button type="button" onClick={loadNextQuestion} disabled={isFetching || !canContinue}>
              {isFetching ? 'Loading...' : 'Next question'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}
