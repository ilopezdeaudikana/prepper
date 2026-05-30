import { useState } from 'react'
import { type Question, ChallengeType } from '@repo/shared-types'
import { CodeArea } from '../../common/components/code-area'
import { Input } from 'antd'

interface ChallengeReplyProps {
  onSubmit: () => void
  onInputChange: (reply: string) => void
  type: Question['type']
}

const { TextArea } = Input

export const ChallengeReply = ({ onSubmit, onInputChange, type }: ChallengeReplyProps) => {
  const [input, setInput] = useState<string>('')
  
  const submit = (e: React.SubmitEvent) => {
    e.preventDefault()
    onSubmit()
    setInput('')
  }

  const handleChange = (reply?: string) => {
    setInput(reply ?? '')
    onInputChange(reply ?? '')
  }

  return (
    <form
      id="reply-form"
      onSubmit={submit}
      className="flex flex-col flex-1"
    >
      <div className="flex flex-col gap-2 flex-1">
        {type && <span id="reply-label">Type your reply here:</span>}
        {type === ChallengeType.Theoretical && (<TextArea
          name='reply'
          onChange={(e) => handleChange(e.target.value)}
          className="min-h-25 mb-2 mt-4 flex-1"
          aria-labelledby="reply-label"
          value={input}
          style={{ resize: 'none' }}
        />)}
        {type === ChallengeType.Coding && (
          <div style={{ flexGrow: 1, minHeight: 0, position: 'relative' }}>
            <CodeArea onChange={handleChange} readOnly={false} id="user-code"/>
          </div>
        )}
      </div>
    </form>
  )
}
