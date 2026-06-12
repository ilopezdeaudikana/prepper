import type { ReportRow } from '@/store/report.store'
import { Button } from 'antd'

export const ExportToMD = ({ rows, topic }: { rows: ReportRow[], topic: string}) => {

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
  missedPointsList
    ? `
#### Missed points
${missedPointsList}`
: ''
}
${
  evaluation.improvedCode
    ? `
#### Improved code
\`\`\`
${evaluation.improvedCode}
\`\`\``
    : ''
}
---
`
      return result + wrapped
    }, '')
  }

  const exportToMarkdown = () => {
    const text = toHtmlText()
    const date = new Date().toISOString()
    const blob = new Blob([text], { type: 'text/markdown;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.setAttribute('download', `report-${topic}-${date}.md`)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
  }

  return <Button onClick={exportToMarkdown}>Export as markdown</Button>
}
