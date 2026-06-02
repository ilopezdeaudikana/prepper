import { useState } from 'react'
import { type Question, ChallengeType } from '@repo/shared-types'
import { CodeArea } from '../../common/components/code-area'
import { Input } from 'antd'

interface ChallengeReplyProps {
  onSubmit: () => void
  onInputChange: (reply: string) => void
  type: Question['type']
  disabled?: boolean
  defaultValue?: string
}

const { TextArea } = Input

export const ChallengeReply = ({ onSubmit, onInputChange, type, disabled, defaultValue }: ChallengeReplyProps) => {
  const [input, setInput] = useState<string>('')
  
  const submit = (e: React.SubmitEvent) => {
    e.preventDefault()
    onSubmit()
  }

  const handleChange = (reply?: string) => {
    setInput(reply ?? '')
    onInputChange(reply ?? '')
  }

  return (
    <form
      id="reply-form"
      onSubmit={submit}
      className="flex flex-1 min-h-0 flex-col gap-2 overflow-hidden mt-4"
    >
      <>
        {type && <h2 id="reply-label" className="font-semibold">Type your reply here:</h2>}
        {type === ChallengeType.Theoretical && (<TextArea
          name='reply'
          disabled={disabled}
          onChange={(e) => handleChange(e.target.value)}
          className="min-h-25 mb-2 mt-4 flex-1"
          aria-labelledby="reply-label"
          value={input}
          style={{ resize: 'none' }}
        />)}
        {type === ChallengeType.Coding && (
          <div style={{ flexGrow: 1, minHeight: 0, position: 'relative' }}>
            <CodeArea value={defaultValue} onChange={handleChange} readOnly={false} id="user-code"/>
          </div>
        )}
      </>
    </form>
  )
}
