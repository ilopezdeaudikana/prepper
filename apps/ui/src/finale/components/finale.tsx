import { Button, Card } from 'antd'
import { useConfiguration, type ConfigurationState, type ConfigurationStore } from '@/store/configuration.store'
import { useNavigate } from 'react-router-dom'
import { useProgress, type ProgressStore } from '@/store/progress.store'
import { Report } from './report'
import { useReport, type ReportStore } from '@/store/report.store'

export const Finale = ({ topic, level, randomMode } : Omit<ConfigurationState, 'storageMode'>) => {

  const resetConfiguration = useConfiguration((state: ConfigurationStore) => state.resetConfiguration)

  const resetProgress = useProgress((state: ProgressStore) => state.resetProgress)

  const resetReport = useReport((state: ReportStore) => state.resetReport)

  const { score } = useProgress((state: ProgressStore) => state.progress)

  const navigate = useNavigate()

  const goBackToStart = () => {
    resetConfiguration()
    resetProgress()
    resetReport()
    navigate('/')
  }

  const topicAndLevel = randomMode ? `random topic and levels` : `${topic} topic and ${level} level`

  return (
    <div className="w-8/10 flex flex-col mx-auto my-8">
      <Card styles={{ body: { padding: '1.25rem' } }} className="justify-center">
        <div className="flex flex-col gap-8 items-center mt-4">
          <h1 className="text-2xl font-bold text-center">
            Congratulations!
          </h1>
          <p className="text-center">You've completed the challenge for {topicAndLevel}!</p>
          <p className="text-center">Your score is: {score}</p>
          <Button type="primary" onClick={goBackToStart}>Go back to the start</Button>
        </div>
        <Report />
      </Card>
    </div>
  )
}