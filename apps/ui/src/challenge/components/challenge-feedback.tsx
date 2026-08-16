import { MarkdownText } from '@/common/components/markdown-text'

import { type Feedback, MINIMUM_SCORE } from '@repo/shared-types'
import { Frown, Smile } from 'lucide-react'
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
        <p className='flex gap-2 max-h-1/3'>
          <span>{feedback.score > MINIMUM_SCORE ? (<Smile className="text-green-700" />) : (<Frown className="text-orange-600" />)}</span>
          <span className={feedback.score > MINIMUM_SCORE ? 'font-semibold text-green-700' : 'font-semibold text-orange-600'}>{feedback.score}</span>
        </p>
      )}
      {feedback.critique && (
        <MarkdownText content={feedback.critique} />
      )}
      {feedback.missedPoints && feedback.missedPoints.length > 0 && (
        <div className="max-h-1/3 overflow-y-auto">
          <p className='font-semibold'>Missed points:</p>
          {feedback.missedPoints.map((point, i) => (
            <p key={`missed-point-${i}`}>{point}</p>))}
        </div>
      )}
      {feedback.improvedCode && (
        <div style={{ flexGrow: 1, minHeight: 0, position: 'relative' }}>
          <CodeArea value={feedback.improvedCode} readOnly={true} id="improved-code" />
        </div>
      )}

    </div >
  )
}
