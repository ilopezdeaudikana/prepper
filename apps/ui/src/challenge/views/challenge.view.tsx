import { Challenge } from '../components/challenge'
import { useProgress, FINAL_STAGE } from '@/store/progress.store'
import { Redirector } from '@/common/components/redirector'
import { useIdentification } from '@/common/hooks/useIdentification'

export default function ChallengeView() {
  
  useIdentification()
  
  const { stage } = useProgress(state => state.progress)

  const shouldRedirect = () => stage === FINAL_STAGE + 1
  
  return (
    <div>
      <Redirector condition={shouldRedirect} to="/finale">
        <Challenge />
      </Redirector>
    </div>
  )
}
