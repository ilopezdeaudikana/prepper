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
    <div className="flex flex-col gap-2 overflow-auto min-h-full">
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
      {feedback.missedPoints && feedback.missedPoints.length && (
        <>
          <p><strong>Missed points:</strong></p>
          <Message
            from="assistant"
          >
            <MessageContent>
              {feedback.missedPoints.map((point, i) => (
                <MessageResponse key={`missed-point-${i}`}>{point}</MessageResponse>))}
            </MessageContent>
          </Message>
        </>
      )}
      {feedback.improvedCode && (
        <div style={{ flexGrow: 1, minHeight: 0, position: 'relative' }}>
          <CodeArea value={feedback.improvedCode} />
        </div>
      )}

    </div >
  )
}
