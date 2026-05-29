import { Button, Card } from 'antd'
import { useProgress, FINAL_STAGE, INITIAL_STAGE } from '@/store/progress.store'
import { Configuration } from '@/configuration/configuration.component'
import { useConfiguration } from '@/store/configuration.store'
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ChallengeType } from '@repo/shared-types'

interface ChallengeTopbarProps {
  canContinue: boolean
  isFetching: boolean
  disabled: boolean
  showFinish: boolean
  idParam: string | null
  onLoadNextQuestion: () => void
  onNavigate: () => void
}

export const ChallengeTopbar = ({ canContinue, isFetching, disabled, idParam, onLoadNextQuestion, onNavigate, showFinish }: ChallengeTopbarProps) => {

  const [isConfigurationOpen, openConfiguration] = useState(false)
  const { topic, level } = useConfiguration(state => state.configuration)
  const setConfiguration = useConfiguration(state => state.setConfiguration)
  const { score, stage } = useProgress(state => state.progress)

  const setProgress = useProgress(state => state.setProgress)

  const navigate = useNavigate()
  
  const restart = () => {
    setConfiguration({
      topic: '', level: undefined, type: ChallengeType.Mixed, randomMode: false
    })
    setProgress({ score: 0, stage: INITIAL_STAGE })
    onNavigate()
  }

  const loadNextQuestion = async (args?: ({ skip: boolean } | undefined)) => {

    if (args?.skip) setProgress({ score, stage: stage + 1 })
    if (stage === FINAL_STAGE) {
      // trigger redirection
      setProgress({ score, stage: FINAL_STAGE })
      return
    } else {
      onLoadNextQuestion()
    }
  }

  const goToReport = () => {
    setProgress({ score, stage: FINAL_STAGE + 1 })
    onNavigate()
  }

const goToHistory = () => {
  navigate('/history')
  onNavigate()
}

  return (
    <Card
      className="p-4"
    >
      <div className="flex justify-between items-center">
        <Button type="primary" className="mr-2" onClick={goToHistory}>
          Review previous challenges
        </Button>

        {topic && level || idParam ? 
        <>
          <p>Topic: {topic ?? 'n/a'}, Level {level ?? 'n/a'}</p>
          <div className='flex gap-4'>
            {!showFinish && !isFetching && canContinue && <Button type="primary" onClick={() => loadNextQuestion({ skip: true })}>Skip evaluation</Button>}
            {!showFinish && <Button type="primary" onClick={() => loadNextQuestion()} disabled={isFetching || !canContinue}>
              {isFetching ? 'Loading...' : 'Next question'}
            </Button>}
            {(!showFinish) && <Button form="reply-form" htmlType="submit" type="primary" disabled={disabled}>Submit</Button>}
            <Button type="dashed" onClick={restart}>
              Restart
            </Button>
            {showFinish && <Button type="primary" onClick={goToReport}>
              See evaluation report
            </Button>}
          </div>
        </>
        :
        <Button type="primary" className="ml-auto" onClick={() => openConfiguration(true)}>Configure new challenge</Button>}
      </div>
      <Configuration open={isConfigurationOpen} onClose={() => openConfiguration(false)}/>
    </Card>
  )
}
