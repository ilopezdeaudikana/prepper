import { Finale } from '../components/finale'
import { useConfiguration } from '@/store/configuration.store'
import { useProgress, FINAL_STAGE } from '@/store/progress.store'
import { Redirector } from '@/common/components/redirector'

export default function FinaleView() {

  const configuration = useConfiguration(state => state.configuration)

  const { stage } = useProgress(state => state.progress)

  const shouldRedirect = () => ((!configuration.level || !configuration.topic) && !configuration.randomMode) || stage !== FINAL_STAGE + 1

  return (
    <div>
      <Redirector condition={shouldRedirect}>
        <Finale {...configuration }/>
      </Redirector>
    </div>
  )
}
