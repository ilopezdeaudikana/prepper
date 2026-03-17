import { useState } from 'react'
import { type Question, ChallengeType } from '@repo/shared-types'
import { CodeArea } from './code-area'
import { Textarea } from '@/components/common/textarea'

interface ChallengeReplyProps {
  onSubmit: (reply: string) => void
  onInputChange: (reply: string) => void
  type: Question['type']
}
export const ChallengeReply = ({ onSubmit, onInputChange, type }: ChallengeReplyProps) => {
  const [input, setInput] = useState<string>('')

  const submit = (e: React.SubmitEvent) => {
    e.preventDefault()
    onSubmit(input)
    setInput('')
  }

  const handleChange = (reply: string) => {
    setInput(reply)
    onInputChange(reply)
  }

  return (
    <form
      id="reply-form"
      onSubmit={submit}
      className="flex flex-col flex-1 min-h-0 overflow-hidden"
    >
      <div className="flex flex-col gap-2 flex-1 min-h-0 overflow-hidden">
        <span id="reply-label">Type your reply here:</span>
        {type === ChallengeType.Theoretical && (<Textarea
          name='reply'
          onChange={(e) => handleChange(e.target.value)}
          className="min-h-25 mb-2 mt-4 flex-1"
          aria-labelledby="reply-label"
          value={input}
        />)}
        {type === ChallengeType.Coding && (
          <CodeArea
            className="flex-1"
            inputAriaLabelledBy="reply-label"
            editable
            code={input}
            onEdit={handleChange}
          />)}
      </div>
    </form>
  )
}
