import { Finale } from '../components/finale'
import { useConfiguration } from '@/store/configuration.store'
import { useProgress, FINAL_STAGE } from '@/store/progress.store'
import { Redirector } from '@/components/ui/redirector'

export default function FinaleView() {

  const { level, topic } = useConfiguration(state => state.configuration)

  const { stage } = useProgress(state => state.progress)

  const shouldRedirect = () => !level || !topic || stage !== FINAL_STAGE

  return (
    <div>
      <Redirector condition={shouldRedirect}>
        <Finale topic={topic} level={level} />
      </Redirector>
    </div>
  )
}
