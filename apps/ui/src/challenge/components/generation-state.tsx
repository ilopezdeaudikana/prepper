import { useEffect, useState, type JSX } from 'react'

export const GenerationState = ({ isFetching, isReady }: { isFetching: boolean, isReady: boolean }): JSX.Element => {
  const [generationStage, setGenerationStage] = useState<string | null>(null)

  useEffect(() => {
    if (!isFetching) {
      setGenerationStage(null)
      return
    }

    const stages = [
      'Checking reusable challenge pool...',
      'Generating a fresh challenge variant...',
      'Validating uniqueness against your history...',
    ]

    let stageIndex = 0
    setGenerationStage(stages[stageIndex])

    const intervalId = window.setInterval(() => {
      stageIndex = Math.min(stageIndex + 1, stages.length - 1)
      setGenerationStage(stages[stageIndex])
    }, 1600)

    return () => window.clearInterval(intervalId)
  }, [isFetching])
  return (
    <div>
      <p>{generationStage ?? (isReady ? 'Loading challenge...' : '')}</p>
    </div>
  )
}