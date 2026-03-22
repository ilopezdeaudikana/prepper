import { CodeArea } from "@/common/components/code-area"
import { MarkdownText } from "@/common/components/markdown-text"
import { Separator } from "@/common/components/separator"
import { useReport } from "@/store/report.store"
import { ChallengeType } from "@repo/shared-types"

export const Report = () => {
  const rows = useReport(state => state.report.rows)

  return (
    <>
      <section>
        {rows.map((row, index) =>
          <article key={index} className="flex flex-col gap-4 mt-4 mb-4">
            <h1 className='font-semibold'>Question {index + 1}</h1>
            <MarkdownText content={row.challenge.question} />
            <p className='font-semibold'>Score: {row.evaluation.score}</p>
            <p className='font-semibold'>Evaluation:</p>
            <MarkdownText content={row.evaluation.critique} />
            {row.evaluation.missedPoints && row.evaluation.missedPoints.length > 0 && <>
              <p className='font-semibold'>Missed points:</p>
              {row.evaluation.missedPoints.map((point, i) => <p key={i}>{point}</p>)}
            </>}
            {row.challenge.type === ChallengeType.Coding && 
            <>
              <p className='font-semibold'>Code:</p>
              <CodeArea
                value={row.challenge.initialCode}
                modified={row.evaluation.improvedCode ?? row.reply}
                height={500}
                isDiff={true}
                id={`diff-${index}`}
              />
            </>
            }
            {index !== rows.length - 1 && <Separator className="mt-4 mb-4" />}
          </article>
        )}

      </section>
    </>
  )
}
