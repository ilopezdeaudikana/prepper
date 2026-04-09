import { Challenge } from '../components/challenge'
import { useConfiguration } from '@/store/configuration.store'
import { useProgress, FINAL_STAGE } from '@/store/progress.store'
import { Redirector } from '@/common/components/redirector'

export default function ChallengeView() {

  const configuration = useConfiguration(state => state.configuration)
  
  const { stage } = useProgress(state => state.progress)

  const shouldRedirect = () => stage === FINAL_STAGE + 1
  
  return (
    <div>
      <Redirector condition={shouldRedirect} to="/finale">
        <Challenge {...configuration}/>
      </Redirector>
    </div>
  )
}
