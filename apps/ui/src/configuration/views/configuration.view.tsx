import { useState } from 'react'
import { Input } from '@/components/common/input'
import { Button } from '@/components/common/button'
import { useConfiguration, type Configuration, type ConfigurationStore } from '@/store/configuration.store'
import { useNavigate } from 'react-router-dom'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/common/select'
import { useProgress, type ProgressStore } from '@/store/progress.store'
import { Switch } from '@/components/common/switch'
import { Checkbox } from '@/components/common/checkbox'

import { Topic } from '@repo/shared-types'
import { Card } from '@/components/common/card'
import { Separator } from '@/components/common/separator'

export default function Configuration() {

  const [configuration, setLocalConfiguration] = useState<Configuration>({ topic: '', level: '', randomMode: false })

  const setConfiguration = useConfiguration((state: ConfigurationStore) => state.setConfiguration)

  const setProgress = useProgress((state: ProgressStore) => state.setProgress)

  const navigate = useNavigate()

  const handleChange = (key: string, value: string | boolean) => {
    setLocalConfiguration({ ...configuration, [key]: value })
  }

  const handleSubmit = async () => {
    const { topic, level, randomMode, storageMode } = configuration
    setConfiguration({
      topic: topic.trim(),
      level: level.trim(),
      randomMode,
      storageMode
    })
    setProgress({ score: 0, stage: 1 })
    navigate('/challenge')
  }

  const isSaveDisabled = () => {
    return (!configuration.topic || !configuration.level) && !configuration.randomMode
  }

  return (
    <div className="max-w-1/2 flex flex-col mx-auto my-8">
      <Card className="flex-none">
        <form onSubmit={(e) => { e.preventDefault(); handleSubmit() }}>
          <div className="flex flex-col gap-8 m-4">
            <div>
              <h1 className="text-2xl font-bold mb-4">Configure your FE challenge</h1>
              <p>Choose a topic and a difficulty level to start the challenge.</p>
            </div>
            <div>
              <label htmlFor="topic">Topic <small>(optimized for {Object.values(Topic).join(', ')})</small></label>
              <Input
                id="topic"
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
                <SelectTrigger className='bg-white' id="level">
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
              <Switch
                id="random-mode"
                name="random-mode"
                onCheckedChange={(e) => handleChange('randomMode', e)}
                checked={configuration.randomMode}
                disabled={!!configuration.topic}
              />
            </div>
            <div className="flex gap-4 items-center mt-2">
              <label
                htmlFor="storage-mode"
              >
                Use previously stored challenges only
              </label>
              <Checkbox
                id="storage-mode"
                name="storage-mode"
                onCheckedChange={(e) => handleChange('storageMode', e)}
              />
            </div>
            <Separator />
            <div className="flex flex-col w-[150px] self-center">
              <Button type="submit" size="sm" disabled={isSaveDisabled()}>Submit</Button>
            </div>
          </div>
        </form>
      </Card>
    </div>
  )
}
