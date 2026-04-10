import { Button, Card } from 'antd'
import { useProgress, FINAL_STAGE, INITIAL_STAGE } from '@/store/progress.store'
import { Configuration } from '@/configuration/configuration.component'
import { useConfiguration } from '@/store/configuration.store'
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'

interface ChallengeTopbarProps {
  canContinue: boolean
  isFetching: boolean
  disabled: boolean
  showRestart: boolean
  showFinish: boolean
  onLoadNextQuestion: () => void
}

export const ChallengeTopbar = ({ canContinue, isFetching, disabled, showRestart, onLoadNextQuestion, showFinish }: ChallengeTopbarProps) => {

  const [isConfigurationOpen, openConfiguration] = useState(false)
  const { topic, level } = useConfiguration(state => state.configuration)

  const { score, stage } = useProgress(state => state.progress)

  const setProgress = useProgress(state => state.setProgress)

  const navigate = useNavigate()
  
  const restart = () => {
    setProgress({ score: 0, stage: INITIAL_STAGE })
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
  }

  return (
    <Card
      className="h-[64px] flex-none"
    >
      <div className="flex justify-between items-center">
        <Button type="primary" className="mr-2" onClick={() => navigate('/history')}>
          Check previous challenges
        </Button>

        {topic && level ? 
        <>
          <p>Topic: {topic}, Level {level}</p>
          <div className='flex gap-4'>
            {!showRestart && !showFinish && !isFetching && <Button type="primary" onClick={() => loadNextQuestion({ skip: true })}>Skip evaluation</Button>}
            {!showRestart && !showFinish && <Button type="primary" onClick={() => loadNextQuestion()} disabled={isFetching || !canContinue}>
              {isFetching ? 'Loading...' : 'Next question'}
            </Button>}
            {(!showRestart || !showFinish) && <Button form="reply-form" htmlType="submit" type="primary" disabled={disabled}>Submit</Button>}
            {(showRestart || showFinish) && <Button type="dashed" onClick={restart}>
              Restart
            </Button>}
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
