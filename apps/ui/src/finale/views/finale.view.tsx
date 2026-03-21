import { Finale } from '../components/finale'
import { useConfiguration } from '@/store/configuration.store'
import { useProgress, FINAL_STAGE } from '@/store/progress.store'
import { Redirector } from '@/common/components/redirector'

export default function FinaleView() {

  const { level, topic, randomMode } = useConfiguration(state => state.configuration)

  const { stage } = useProgress(state => state.progress)

  const shouldRedirect = () => ((!level || !topic) && !randomMode) || stage !== FINAL_STAGE

  return (
    <div>
      <Redirector condition={shouldRedirect}>
        <Finale topic={topic} level={level} randomMode={randomMode}/>
      </Redirector>
    </div>
  )
}
