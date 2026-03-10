import { Button } from '@/components/common/button'
import { useConfiguration, type Configuration, type ConfigurationStore } from '@/store/configuration.store'
import { useNavigate } from 'react-router-dom'
import { useProgress, type ProgressStore } from '@/store/progress.store'
import { Card } from '@/components/common/card'

export const Finale = ({ topic, level, randomMode } : Omit<Configuration, 'storageMode'>) => {

  const resetConfiguration = useConfiguration((state: ConfigurationStore) => state.resetConfiguration)

  const resetProgress = useProgress((state: ProgressStore) => state.resetProgress)

  const { score } = useProgress((state: ProgressStore) => state.progress)

  const navigate = useNavigate()

  const goBackToStart = () => {
    resetConfiguration()
    resetProgress()
    navigate('/')
  }

  const topicAndLevel = randomMode ? `for random topic and levels` : `for ${topic} topic and ${level} level`

  return (
    <div className="max-w-1/2 flex flex-col mx-auto my-8">
      <Card className="justify-center">
        <div className="flex flex-col gap-8 items-center">
          <h1 className="text-2xl font-bold text-center">
            Congratulations!
          </h1>
          <p className="text-center">You've completed the challenge for {topicAndLevel}!</p>
          <p className="text-center">Your score is: {score}</p>
          <Button size='sm' type="button" onClick={goBackToStart}>Go back to the start</Button>
        </div>
      </Card>
    </div>
  )
}