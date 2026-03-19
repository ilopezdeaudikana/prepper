import {
  Message,
  MessageContent,
  MessageResponse
} from '@/components/ai-elements/message'

import { type Feedback, MINIMUM_SCORE } from '@repo/shared-types'
import { Badge } from '@/components/common/badge'

import { CodeArea } from './code-area'

export const ChallengeFeedback = ({ feedback }: { feedback: Feedback }) => {

  return (

    <div className="flex flex-col gap-2 overflow-auto">
      {feedback?.error ? (
        <div><p>Error loading data</p>
          <pre className="whitespace-pre-wrap">
            {JSON.stringify(feedback, null, 2)}
          </pre>
        </div>
      ) : null}
      {feedback.score && (
        <p><Badge className="mr-2" color={feedback.score > MINIMUM_SCORE ? 'green' : 'red'}>{feedback.score}</Badge></p>
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
        <CodeArea className="flex-1 min-h-96" code={feedback.improvedCode} header='Improved Code' />
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
  )
}
