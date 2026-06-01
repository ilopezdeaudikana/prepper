import { CodeArea } from '@/common/components/code-area'
import { MarkdownText } from '@/common/components/markdown-text'
import { Divider } from 'antd'
import { useReport } from '@/store/report.store'
import { ChallengeType } from '@repo/shared-types'
import { ExportToMD } from './export'
import { useConfiguration } from '@/store/configuration.store'

export const Report = () => {
  const rows = useReport((state) => state.report.rows)
  const topic = useConfiguration((state) => state.configuration.topic)

  const toHtmlText = (): string => {
    return rows.reduce((result, row) => {
      const { challenge, reply, evaluation } = row

      const solutionSection = challenge.initialCode
        ? `\`\`\`\n${reply}\n\`\`\``
        : reply

      const missedPointsList =
        evaluation.missedPoints && evaluation.missedPoints.length > 0
          ? evaluation.missedPoints.map((item) => `* ${item}`).join('\n')
          : ''

      const wrapped = `
## Score: ${evaluation.score}
### ${challenge.question}
${challenge.initialCode ? `\`\`\`\n${challenge.initialCode}\n\`\`\`` : ''}

### Solution
${solutionSection}

### Evaluation
${evaluation.critique || ''}
${
  evaluation.improvedCode
    ? `
#### Improved code
\`\`\`
${evaluation.improvedCode}
\`\`\``
    : ''
}
${missedPointsList}
---
`
      return result + wrapped
    }, '')
  }

  return (
    <>
      <ExportToMD text={toHtmlText()} topic={topic} />
      <section>
        {rows.map((row, index) => (
          <article key={index} className="flex flex-col gap-4 mt-4 mb-4">
            <h1 className="font-semibold">Question {index + 1}</h1>
            <MarkdownText content={row.challenge.question} />
            <p className="font-semibold">Score: {row.evaluation.score}</p>
            <p className="font-semibold">Evaluation:</p>
            <MarkdownText content={row.evaluation.critique ?? ''} />
            {row.evaluation.missedPoints &&
              row.evaluation.missedPoints.length > 0 && (
                <>
                  <p className="font-semibold">Missed points:</p>
                  {row.evaluation.missedPoints.map((point, i) => (
                    <p key={i}>{point}</p>
                  ))}
                </>
              )}
            {row.challenge.type === ChallengeType.Coding && (
              <>
                <p className="font-semibold">Code:</p>
                <CodeArea
                  value={row.reply ?? row.challenge.initialCode}
                  modified={row.evaluation.improvedCode ?? row.reply}
                  height={500}
                  isDiff={true}
                  readOnly={true}
                  id={`diff-${index}`}
                />
              </>
            )}
            {index !== rows.length - 1 && <Divider className="mt-4 mb-4" />}
          </article>
        ))}
      </section>
    </>
  )
}
