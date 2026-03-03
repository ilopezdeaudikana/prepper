import { Challenge } from '../components/challenge'
import { Navigate } from 'react-router-dom'
import { useConfiguration } from '@/store/configuration.store'
import { useProgress, FINAL_STAGE } from '@/store/progress.store'

export default function ChallengeView() {

  const { level, topic } = useConfiguration(state => state.configuration)

  const { stage } = useProgress(state => state.progress)

  if (!level || !topic || stage === 0 || stage === FINAL_STAGE) {
    return (
      <div>
        <Navigate to='/' />
      </div>
    )
  } else {
    return (
      <div>
        <Challenge level={level} topic={topic} />
      </div>
    )
  }
}
