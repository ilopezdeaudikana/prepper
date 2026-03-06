import { CodeBlock, CodeBlockActions, CodeBlockCopyButton, CodeBlockHeader } from '@/components/ai-elements/code-block'
import { type JSX } from 'react'
import { useToast } from '@repo/toast'

export const CodeArea = ({ code, header }: { code: string, header?: string }): JSX.Element => {

  const { openToast } = useToast()

  const handleCopy = () => {
    openToast({ message: 'Copied to clipboard' })
  }

  const handleCopyError = () => {
    openToast({ message: 'Failed to copy code to clipboard' })
  }

  return (
    <CodeBlock code={code ?? ''} language="javascript">
      <CodeBlockHeader>
        {header && (<p>{header}</p>)}
        <CodeBlockActions>
          <CodeBlockCopyButton onCopy={handleCopy} onError={handleCopyError} />
        </CodeBlockActions>
      </CodeBlockHeader>
    </CodeBlock>
  )
}