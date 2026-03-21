import { type JSX } from 'react'
import Editor from '@monaco-editor/react'
import { monacoTheme } from '../../challenge/utils/monacoTheme'

export const CodeArea = ({ value, onChange, height }: {
  value?: string,
  height?: number
  onChange?: (code?: string) => void
}): JSX.Element => {

  const handleEditorWillMount = (monaco: any) => {
    monaco.languages.typescript.javascriptDefaults.setEagerModelSync(true)
    monaco.editor.defineTheme('default', monacoTheme)
    monaco.languages.typescript.typescriptDefaults.setDiagnosticsOptions({
      noSemanticValidation: true,
      noSyntaxValidation: true,
    })
  }

  return (
    <Editor
      defaultLanguage="typescript"
      height={height ?? "100%"}
      value={value}
      onChange={onChange}
      beforeMount={handleEditorWillMount}
      theme='default'
      options={{
        minimap: { enabled: false },
        stickyScroll: { enabled: false },
        automaticLayout: true,
        scrollBeyondLastLine: false,
        padding: { top: 16, bottom: 16 }
      }}
    />
  )
}
