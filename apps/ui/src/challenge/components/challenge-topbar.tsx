import { Button } from '@/common/components/button'
import { useProgress, FINAL_STAGE, INITIAL_STAGE } from '@/store/progress.store'

import { useConfiguration } from '@/store/configuration.store'
import { Card } from '@/common/components/card'

interface ChallengeTopbarProps {
  canContinue: boolean
   isFetching: boolean
   disabled: boolean
   showRestart: boolean
  onLoadNextQuestion: () => void
}

export const ChallengeTopbar = ({ canContinue, isFetching, disabled, showRestart, onLoadNextQuestion }: ChallengeTopbarProps) => {

  const { topic, level } = useConfiguration(state => state.configuration)

  const { score, stage } = useProgress(state => state.progress)
  
  const setProgress = useProgress(state => state.setProgress)

  const restart = () => {
    setProgress({ score: 0, stage: INITIAL_STAGE })
  }


  const loadNextQuestion = async () => {
    if (stage === FINAL_STAGE) {
      // trigger redirection
      setProgress({ score, stage: FINAL_STAGE })
      return
    } else {
      onLoadNextQuestion()
    }
  }


  return (
    <Card
      className="h-[64px] flex-none"
    >
      <div className="flex justify-between">
        <p>Topic: {topic }, Level {level}</p>
        <div className='flex gap-4'>
          <Button form="reply-form" type="submit" disabled={disabled} size='sm'>Submit</Button>
          {showRestart && <Button type="button" onClick={restart} size='sm'>
            Restart
          </Button>}
          {!showRestart && <Button type="button" onClick={loadNextQuestion} disabled={isFetching || !canContinue} size='sm'>
            {isFetching ? 'Loading...' : 'Next question'}
          </Button>}
        </div>
      </div>
    </Card>
  )
}
