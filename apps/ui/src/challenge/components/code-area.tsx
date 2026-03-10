import { CodeBlock, CodeBlockActions, CodeBlockCopyButton, CodeBlockHeader } from '@/components/ai-elements/code-block'
import { type JSX } from 'react'
import { useToast } from '@repo/toast'

interface CodeAreaProps {
  code: string, 
  header?: string, 
  editable?: boolean
  onEdit?: (code: string) => void
  inputAriaLabelledBy?: string
}

export const CodeArea = ({ code, header, editable, onEdit, inputAriaLabelledBy }: CodeAreaProps): JSX.Element => {

  const { openToast } = useToast()

  const handleCopy = () => {
    openToast({ message: 'Copied to clipboard' })
  }

  const handleCopyError = () => {
    openToast({ message: 'Failed to copy code to clipboard' })
  }

  return (
    <CodeBlock
      className='dark flex flex-col overflow-auto h-full'
      code={code ?? ''}
      language="javascript"
      editable={editable}
      onEdit={onEdit}
      inputAriaLabelledBy={inputAriaLabelledBy}
    >
      <CodeBlockHeader>
        {header && (<p>{header}</p>)}
        <CodeBlockActions>
          <CodeBlockCopyButton onCopy={handleCopy} onError={handleCopyError} />
        </CodeBlockActions>
      </CodeBlockHeader>
    </CodeBlock>
  )
}
