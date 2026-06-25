import { useEffect, useMemo, useState, type JSX } from 'react'

export const GenerationState = ({
  isFetching,
  isReady,
}: {
  isFetching: boolean
  isReady: boolean
}): JSX.Element => {
  const stages = useMemo(() => [
    'Checking reusable challenge pool...',
    'Generating a fresh challenge variant...',
    'Validating uniqueness against your history...',
  ],[])

  const [generationStage, setGenerationStage] = useState<string | null>(() => {
    if (!isFetching) return null
    else return stages[0]
  })

  useEffect(() => {
    if (!isFetching) {
      return
    }
    let stageIndex = 0

    const intervalId = window.setInterval(() => {
      stageIndex = Math.min(stageIndex + 1, stages.length - 1)
      setGenerationStage(stages[stageIndex])
    }, 1600)

    return () => window.clearInterval(intervalId)
  }, [isFetching, stages])

  return (
    <div>
      <p>{generationStage ?? (isReady ? 'Loading challenge...' : '')}</p>
    </div>
  )
}
