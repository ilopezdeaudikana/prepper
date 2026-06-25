import { useEffect, useRef, useState, type JSX } from 'react'
import Editor, { DiffEditor, type Monaco, type OnMount } from '@monaco-editor/react'
import { shikiToMonaco } from '@shikijs/monaco'
import { getHighlighter, themes } from '../utils/shiki-engine'
import { stripMarkdownCode } from '@/common/utils/strip-markdown-code'

type IStandaloneCodeEditor = Parameters<OnMount>[0];

export const CodeArea = ({ value, onChange, height, id, isDiff, modified, readOnly }: {
  value?: string,
  modified?: string,
  height?: number
  readOnly: boolean
  onChange?: (code?: string) => void
  id: string,
  isDiff?: boolean
}): JSX.Element => {

  const [isReady, setIsReady] = useState(false)
  const [canLoad, setCanLoad] = useState(false)

  const highlighterRef = useRef<unknown>(null)
  const monacoRef = useRef<IStandaloneCodeEditor | null>(null)
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const handleEditorWillMount = async (monaco: Monaco) => {
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

  const cleanCode = stripMarkdownCode(value ?? '')

  const editorOptions = {
    defaultLanguage: 'typescript',
    height: height ?? '100%',
    theme: themes[0],
    value: isDiff ? undefined : cleanCode,
    onChange: onChange,
    beforeMount: handleEditorWillMount,
    path: `${id}.tsx`,
    original: isDiff ? cleanCode : undefined,
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
      tabSize: 2,
      readOnly: readOnly
    }
  }

  useEffect(() => {

    if (!monacoRef.current) return
    getHighlighter().then((h) => {

      timeoutRef.current = setTimeout(() => {
        highlighterRef.current = h
        shikiToMonaco(h, monacoRef.current)
        setIsReady(true)
      }, 0)

    })
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current)
      highlighterRef.current = null
      monacoRef.current = null
    }
  }, [canLoad])

  return (
    <div style={{ opacity: isReady ? 1 : 0, transition: 'opacity 0.2s', height: '100%' }}>
      {
        isDiff ?
          (<DiffEditor {...editorOptions} options={editorOptions.options} keepCurrentOriginalModel={true} keepCurrentModifiedModel={true} />)
          :
          (<Editor {...editorOptions} options={editorOptions.options} />)}
    </div>
  )
}
