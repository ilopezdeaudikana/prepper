import { useState } from 'react'
import {
  useQuery
} from '@tanstack/react-query'

import {
  PromptInput,
  PromptInputBody,
  PromptInputTextarea,
} from '@/components/ai-elements/prompt-input'

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

import * as sample from './sample.json'
import type { Feedback, } from './mastra/agents/interview-agent'
import { Badge } from 'lucide-react'

export default function App() {
  const [input, setInput] = useState<string>('')
  const [feedback, setFeedback] = useState<Feedback | null>(null)

  // Queries
  const query = useQuery({ queryKey: ['question'], queryFn: () => ChallengeService.getChallenge('senior', 'react') })

  const data = !query.data || query.data.error ? sample : query.data

  const handleCopy = () => {
    console.log("Copied code to clipboard")
  }

  const handleCopyError = () => {
    console.error("Failed to copy code to clipboard")
  }

  const handleSubmit = async () => {
    if (!input.trim()) return

    const result: Feedback = await ChallengeService.submitAnswer(data.question, input, 'senior')
    console.log(result)
    setFeedback(result)
    setInput('')
  }

  return (
    <div className="max-w-12xl flex flex-col mx-auto p-4 relative h-screen justify-between">
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
                  <Badge className="mr-2"> {feedback.score} </Badge>
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
        <PromptInput onSubmit={handleSubmit} className="mb-10 mt-10">
          <PromptInputBody>
            <PromptInputTextarea
              onChange={(e) => setInput(e.target.value)}
              className="md:leading-10"
              value={input}
            />
          </PromptInputBody>
        </PromptInput>
      </div>
    </div>
  )
}