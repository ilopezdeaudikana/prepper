import { Challenge } from '../components/challenge'
import { useConfiguration } from '@/store/configuration.store'
import { useProgress, FINAL_STAGE, INITIAL_STAGE } from '@/store/progress.store'
import { Redirector } from '@/common/components/redirector'

export default function ChallengeView() {

  const configuration = useConfiguration(state => state.configuration)

  const { topic, level, randomMode } = configuration
  
  const { stage } = useProgress(state => state.progress)

  const shouldRedirect = () => ((!level || !topic) && !randomMode) || stage === INITIAL_STAGE || stage === FINAL_STAGE
  
  const to =  stage === FINAL_STAGE ? '/finale' : '/'
  
  return (
    <div>
      <Redirector condition={shouldRedirect} to={to}>
        <Challenge {...configuration}/>
      </Redirector>
    </div>
  )
}
