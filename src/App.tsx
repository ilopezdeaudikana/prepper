import { useState } from 'react'
import {
  useQuery
} from '@tanstack/react-query'

import {
  Conversation,
  ConversationContent,
  ConversationScrollButton,
} from '@/components/ai-elements/conversation'

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

import type { Feedback, Question, } from './mastra/agents/interview-agent'
import { Badge } from '@/components/ui/badge'
import { Textarea } from '@/components/ui/textarea'
import { Button } from '@/components/ui/button'

export default function App() {
  const [input, setInput] = useState<string>('')
  const [feedback, setFeedback] = useState<Feedback | null>(null)

  const query = useQuery({ queryKey: ['question'], queryFn: () => ChallengeService.getChallenge('senior', 'react') })

  if (!query.data || query.data?.error) {
    return <div><p>Error loading data</p><pre>{JSON.stringify(query.data, null, 2)}</pre></div>
  }

  const data = query.data

  const handleCopy = () => {
    console.log("Copied code to clipboard")
  }

  const handleCopyError = () => {
    console.error("Failed to copy code to clipboard")
  }

  const handleSubmit = async () => {
    if (!input.trim()) return

    const result: Feedback = await ChallengeService.submitAnswer(data as Question, input, 'senior')
    console.log(result)
    setFeedback(result)
    setInput('')
  }

  return (
    <div className="max-w-9/10 flex flex-col mx-auto p-4 relative h-screen justify-between align-self-center">
      <div className="h-full max-h-9/10 overflow-y-auto">
        {data?.type === 'theoretical' && (
          <Message
            from="system">
            <MessageContent>
              <MessageResponse>{data.question}</MessageResponse>
            </MessageContent>
          </Message>
        )}
        {data?.type === 'coding' && (
          <Message
            from="system">
            <MessageContent>
              <MessageResponse
                className='mb-4'
              >{data.question}</MessageResponse>
              <CodeBlock code={data.initialCode} language="javascript">
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
      <div className="flex flex-col flex-1">
        <Conversation>
          <ConversationContent>
            {feedback && (
              <div className="mt-6">
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
            <ConversationScrollButton />
          </ConversationContent>
        </Conversation>
        <form onSubmit={(e) => { e.preventDefault(); handleSubmit() }}>
          <div className="flex flex-col mb-2 gap-2">
            <Textarea
              onChange={(e) => setInput(e.target.value)}
              className="min-h-25 mb-2 mt-4"
              value={input}
            />
            <Button type="submit">Submit</Button>
          </div>
        </form>
      </div>
    </div>
  )
}