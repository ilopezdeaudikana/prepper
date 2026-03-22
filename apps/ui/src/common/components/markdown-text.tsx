import { useState, useEffect, useMemo } from 'react'
import { createHighlighter, type BundledLanguage, type Highlighter } from 'shiki'

const highlighterOptions =
{
  themes: ['github-light'],
  langs: ['tsx', 'typescript'] as BundledLanguage[]
}

const highlighterPromise = createHighlighter(highlighterOptions)

export const MarkdownText = ({ content }: { content: string }) => {
  const [highlighter, setHighlighter] = useState<Highlighter | null>(null)

  useEffect(() => {
    highlighterPromise.then(setHighlighter);
  }, [])

  const rendered = useMemo(() => {
    if (!highlighter) return <span>{content}</span>

    // Split text by backticks: "text `code` text" -> ["text ", "code", " text"]
    const parts = content.split(/`(.+?)`/g)

    return (
      <p className="grow min-h-0 relative leading-7 mb-4">
        {parts.map((part, index) => {
          const isCode = index % 2 !== 0 // Odd indices are the captured groups (code)

          if (isCode) {
            // Highlight the code snippet specifically as TSX
            const { tokens } = highlighter.codeToTokens(part, {
              lang: highlighterOptions.langs[0],
              theme: highlighterOptions.themes[0],
            })

            return (
              <code key={index} className="mx-1 px-1.5 py-0.5 rounded-md bg-gray-500 font-mono text-sm inline-flex">
                {tokens[0].map((token, j) => (
                  // style={{ color: token.color }}
                  <span key={j} className="text-gray-50">
                    {token.content}
                  </span>
                ))}
              </code>
            )
          }

          // Plain text part
          return <span key={index}>{part}</span>
        })}
      </p>
    )
  }, [highlighter, content])

  return <div>{rendered}</div>
}

