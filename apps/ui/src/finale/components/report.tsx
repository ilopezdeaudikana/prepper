import { CodeArea } from "@/common/components/code-area"
import { MarkdownText } from "@/common/components/markdown-text"
import { Separator } from "@/common/components/separator"
import { useReport, type ReportRow } from "@/store/report.store"
import { ChallengeType } from "@repo/shared-types"

export const Report = () => {
  const rows = useReport(state => state.report.rows)

  const buildCode = (row: ReportRow) => {
    return `
// Original Code
${row.challenge.initialCode}

/* 
*
* Improved code below
* 
*/


${row.evaluation.improvedCode ?? row.reply}
`
  }

  return (
    <>
      <section>
        {rows.map((row, index) =>
          <article key={index} className="flex flex-col gap-4 mt-4 mb-4">
            <h1><strong>Question {index + 1}</strong></h1>
            <MarkdownText content={row.challenge.question}/>
            <p><strong>Score: {row.evaluation.score}</strong></p>
            <p><strong>Evaluation:</strong></p>
            <MarkdownText content={row.evaluation.critique}/>
            {row.evaluation.missedPoints && row.evaluation.missedPoints.length && <>
              <p><strong>Missed points:</strong></p>
              {row.evaluation.missedPoints.map(point => <p>{point}</p>)}
            </>}
            {row.challenge.type === ChallengeType.Coding && <CodeArea value={buildCode(row)} height={500} />}
            {index !== rows.length - 1 &&<Separator className="mt-4 mb-4" />}
          </article>
        )}

      </section>
    </>
  )
}
