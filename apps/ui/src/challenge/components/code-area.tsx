import { CodeBlock, CodeBlockActions, CodeBlockCopyButton, CodeBlockHeader } from '@/components/ai-elements/code-block'
import { type JSX } from 'react'
import { useToast } from '@repo/toast'
import { cn } from '@/lib/utils'

interface CodeAreaProps {
  code: string, 
  header?: string, 
  editable?: boolean
  onEdit?: (code: string) => void
  inputAriaLabelledBy?: string
  className?: string
}

export const CodeArea = ({
  code,
  header,
  editable,
  onEdit,
  inputAriaLabelledBy,
  className,
}: CodeAreaProps): JSX.Element => {
  const { openToast } = useToast()

  const handleCopy = () => {
    openToast({ message: 'Copied to clipboard' })
  }

  const handleCopyError = () => {
    openToast({ message: 'Failed to copy code to clipboard' })
  }

  const showHeader = Boolean(header) || !editable
  const showCopyButton = !editable

  return (
    <CodeBlock
      className={cn('dark', className)}
      code={code ?? ''}
      language="javascript"
      editable={editable}
      onEdit={onEdit}
      inputAriaLabelledBy={inputAriaLabelledBy}
    >
      {showHeader ? (
        <CodeBlockHeader>
          {header ? <p>{header}</p> : <span />}
          {showCopyButton ? (
            <CodeBlockActions>
              <CodeBlockCopyButton onCopy={handleCopy} onError={handleCopyError} />
            </CodeBlockActions>
          ) : null}
        </CodeBlockHeader>
      ) : null}
    </CodeBlock>
  )
}
