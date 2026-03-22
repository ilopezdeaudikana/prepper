import { useEffect, useRef, useState, type JSX } from 'react'
import Editor, { DiffEditor } from '@monaco-editor/react'
import { shikiToMonaco } from '@shikijs/monaco'
import { getHighlighter } from '../utils/shiki-engine'

export const CodeArea = ({ value, onChange, height, id, isDiff, modified }: {
  value?: string,
  modified?: string,
  height?: number
  onChange?: (code?: string) => void
  id: string,
  isDiff?: boolean
}): JSX.Element => {

  const [isReady, setIsReady] = useState(false)
  const [canLoad, setCanLoad] = useState(false)

  const highlighterRef = useRef<any>(null)
  const monacoRef = useRef<any>(null)

  const handleEditorWillMount = async (monaco: any) => {
    monaco.languages.typescript.javascriptDefaults.setEagerModelSync(true)

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
    monacoRef.current = monaco
    setCanLoad(true)
  }

  const editorOptions = {
    defaultLanguage: 'typescript',
    height: height ?? '100%',
    value: isDiff ? undefined : value,
    onChange: onChange,
    beforeMount: handleEditorWillMount,
    theme: 'one-dark-pro',
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

  useEffect(() => {

    if (!monacoRef.current) return
    getHighlighter().then((h) => {
      highlighterRef.current = h
      shikiToMonaco(h, monacoRef.current)
      setIsReady(true)
    })
    return () => {
      highlighterRef.current = null
      monacoRef.current = null
    }
  }, [monacoRef.current, canLoad])

  return (
    <div style={{ opacity: isReady ? 1 : 0, transition: 'opacity 0.2s', height: '100%' }}>
      {
        isDiff ?
          (<DiffEditor {...editorOptions} options={editorOptions.options} />)
          :
          (<Editor {...editorOptions} options={editorOptions.options} />)}
    </div>
  )
}
