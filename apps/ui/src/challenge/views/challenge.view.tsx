import { Challenge } from '../components/challenge'
import { useConfiguration } from '@/store/configuration.store'
import { useProgress, FINAL_STAGE } from '@/store/progress.store'
import { Redirector } from '@/components/ui/redirector'

export default function ChallengeView() {

  const { level, topic } = useConfiguration(state => state.configuration)

  const { stage } = useProgress(state => state.progress)

  const canContinueToTarget = () => !level || !topic || stage === 0 || stage === FINAL_STAGE
  
  return (
    <div>
      <Redirector condition={canContinueToTarget}>
        <Challenge topic={topic} level={level} />
      </Redirector>
    </div>
  )
}
