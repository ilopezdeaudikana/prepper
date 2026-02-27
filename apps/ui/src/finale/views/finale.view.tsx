import { Button } from '@/components/ui/button'
import { useConfiguration, type Configuration, type ConfigurationStore } from '@/store/configuration.store'
import { useNavigate } from 'react-router-dom'
import { useProgress, type ProgressStore } from '@/store/progress.store'

export default function Configuration() {

  const { topic, level } = useConfiguration((state: ConfigurationStore) => state.configuration)

  const resetConfiguration = useConfiguration((state: ConfigurationStore) => state.resetConfiguration)

  const resetProgress = useProgress((state: ProgressStore) => state.resetProgress)

  const { score } = useProgress((state: ProgressStore) => state.progress)

  const navigate = useNavigate()

  const goBackToStart = () => {
    resetConfiguration()
    resetProgress()
    navigate('/')
  }

  return (
    <div className="max-w-1/2 flex flex-col mx-auto p-4 relative h-screen justify-between align-self-center">
        <div className="flex flex-col mb-2 gap-2">
          <h1 className="text-2xl font-bold">Congratulations! You've completed the challenge for {topic} topic and {level} level!</h1>
          <p>Your score is: {score}</p>
          <Button type="button" onClick={goBackToStart}>Go back to the start</Button>
        </div>
    </div>
  )
}