import { MarkdownText } from '@/common/components/markdown-text'

import { type Feedback, MINIMUM_SCORE } from '@repo/shared-types'
import { Badge } from '@/common/components/badge'
import { CodeArea } from '../../common/components/code-area'

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
        <MarkdownText content={feedback.critique} />
      )}
      {feedback.missedPoints && feedback.missedPoints.length && (
        <>
          <p><strong>Missed points:</strong></p>
          {feedback.missedPoints.map((point, i) => (
            <p key={`missed-point-${i}`}>{point}</p>))}
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
