import { type JSX } from 'react'
import Editor, { DiffEditor } from '@monaco-editor/react'
import { monacoTheme } from '../../challenge/utils/monacoTheme'

export const CodeArea = ({ value, onChange, height, id, isDiff, modified }: {
  value?: string,
  modified?: string,
  height?: number
  onChange?: (code?: string) => void
  id: string,
  isDiff?: boolean
}): JSX.Element => {

  const handleEditorWillMount = (monaco: any) => {
    monaco.languages.typescript.javascriptDefaults.setEagerModelSync(true)
    monaco.editor.defineTheme('default', monacoTheme)
    monaco.languages.typescript.typescriptDefaults.setCompilerOptions({
      jsx: monaco.languages.typescript.JsxEmit.React,
      target: monaco.languages.typescript.ScriptTarget.Latest,
      allowNonTsExtensions: true,
      moduleResolution: monaco.languages.typescript.ModuleResolutionKind.NodeJs,
      noResolve: true
    })
    monaco.languages.typescript.typescriptDefaults.setDiagnosticsOptions({
      diagnosticCodesToIgnore: [2307]
    })
  }

  const editorOptions = {
    defaultLanguage: 'typescript',
    height: height ?? '100%',
    value: isDiff ? undefined : value,
    onChange: onChange, beforeMount: handleEditorWillMount,
    theme: 'default',
    path: `${id}.tsx`,
    original: isDiff ? value : undefined, 
    modified,
    options: {
      minimap: { enabled: false },
      stickyScroll: { enabled: false },
      automaticLayout: true,
      scrollBeyondLastLine: false,
      padding: { top: 16, bottom: 16 },
      fixedOverflowWidgets: true,
      lineNumbersMinChars: 2,
      folding: isDiff ? false : true,
      indentation: 2,
      tabSize: 2
    }
  }
  return (
    <>
      {
        isDiff ?
          (<DiffEditor {...editorOptions} options={editorOptions.options} />)
          :
          (<Editor {...editorOptions} options={editorOptions.options} />)}
    </>
  )
}
