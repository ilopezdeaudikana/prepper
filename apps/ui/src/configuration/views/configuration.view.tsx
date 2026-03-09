import { useState } from 'react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { useConfiguration, type Configuration, type ConfigurationStore } from '@/store/configuration.store'
import { useNavigate } from 'react-router-dom'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useProgress, type ProgressStore } from '@/store/progress.store'
import { Toggle } from '@/components/ui/switch'
import { Topic } from '@repo/shared-types'

export default function Configuration() {

  const [configuration, setLocalConfiguration] = useState<Configuration>({ topic: '', level: '', randomMode: false })

  const setConfiguration = useConfiguration((state: ConfigurationStore) => state.setConfiguration)

  const setProgress = useProgress((state: ProgressStore) => state.setProgress)

  const navigate = useNavigate()

  const handleChange = (key: string, value: string | boolean) => {
    setLocalConfiguration({ ...configuration, [key]: value })
  }

  const handleSubmit = async () => {
    const { topic, level, randomMode } = configuration
    setConfiguration({
      topic: topic.trim(),
      level: level.trim(),
      randomMode
    })
    setProgress({ score: 0, stage: 1 })
    navigate('/challenge')
  }

  const isSaveDisabled = () => {
    return (!configuration.topic || !configuration.level) && !configuration.randomMode
  }

  return (
    <div className="max-w-1/2 flex flex-col mx-auto p-4 relative h-screen justify-between align-self-center">
      <form onSubmit={(e) => { e.preventDefault(); handleSubmit() }}>
        <div className="flex flex-col mb-2 gap-4">
          <div>
            <h1 className="text-2xl font-bold mb-2">Configure your FE challenge</h1>
            <p>Choose a topic and a difficulty level to start the challenge.</p>
          </div>
          <div>
            <label htmlFor="topic">Topic <small>(optimized for {Object.values(Topic).join(', ')})</small></label>
            <Input
              name="topic"
              onChange={(e) => handleChange('topic', e.target.value)}
              className="mb-2 mt-4"
              value={configuration.topic}
              disabled={configuration.randomMode}
            />
          </div>
          <div
          >
            <label
              htmlFor="level"
              className="block mb-4 mt-2"
            >
              Level
            </label>
            <Select
              name="level"
              value={configuration.level}
              onValueChange={(e) => handleChange('level', e)}
              disabled={configuration.randomMode}
            >
              <SelectTrigger>
                <SelectValue placeholder="Pick an option" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="junior">Junior</SelectItem>
                <SelectItem value="mid">Mid</SelectItem>
                <SelectItem value="senior">Senior</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <p className="mt-4">Or maybe you prefer random level and topics:</p>

          <div className="flex gap-4 align-center mt-2">
            <label
              htmlFor="random-mode"
            >
              Random mode
            </label>
            <Toggle
              id="random-mode"
              onCheckedChange={(e) => handleChange('randomMode', e)}
              checked={configuration.randomMode}
            />
          </div>
          <Button type="submit" disabled={isSaveDisabled()}>Submit</Button>
        </div>
      </form>
    </div>
  )
}