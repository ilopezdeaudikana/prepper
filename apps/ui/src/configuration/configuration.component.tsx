import { useState } from 'react'
import { useConfiguration, type ConfigurationState, type ConfigurationStore } from '@/store/configuration.store'
import { Select, Switch, Checkbox, Divider, Drawer, Button, Input } from 'antd'
import { useProgress, type ProgressStore } from '@/store/progress.store'
import { RANDOM, Topic } from '@repo/shared-types'

interface ConfigurationProps {
  open: boolean,
  onClose: () => void
}
export const Configuration = ({ open, onClose }: ConfigurationProps) => {

  const [configuration, setLocalConfiguration] = useState<ConfigurationState>({ topic: '', level: '', randomMode: false })

  const setConfiguration = useConfiguration((state: ConfigurationStore) => state.setConfiguration)

  const setProgress = useProgress((state: ProgressStore) => state.setProgress)

  const handleChange = (key: string, value: string | boolean) => {
    setLocalConfiguration({ ...configuration, [key]: value })
  }

  const handleSubmit = async () => {
    const { topic, level, randomMode, storageMode } = configuration
    setConfiguration({
      topic: randomMode ? RANDOM : topic.trim(),
      level: randomMode ? RANDOM : level.trim(),
      randomMode,
      storageMode
    })
    setProgress({ score: 0, stage: 0 })
    onClose()
  }

  const isSaveDisabled = () => {
    return (!configuration.topic || !configuration.level) && !configuration.randomMode
  }

  return (
    <Drawer
      title="Configure challenge"
      placement='left'
      onClose={() => onClose()}
      open={open}
    >
      <form onSubmit={(e) => { e.preventDefault(); handleSubmit() }}>
        <div className="flex flex-col gap-8 m-4">
          <h2 className="text-xl mb-4">Choose a topic and a difficulty level to start the challenge.</h2>
          <div>
            <label className="block mb-4" htmlFor="topic">Topic <small>(optimized for {Object.values(Topic).join(', ')})</small></label>
            <Input
              id="topic"
              name="topic"
              onChange={(e) => handleChange('topic', e.target.value)}
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
              style={{ width: 150 }}
              onChange={(e) => handleChange('level', e)}
              placeholder="Select level"
              options={[
                { value: 'junior', label: 'Junior' },
                { value: 'mid', label: 'Mid' },
                { value: 'senior', label: 'Senior' }
              ]}
              disabled={configuration.randomMode}
            />
          </div>

          <div className="flex gap-4 align-center mt-2">
            <label
              htmlFor="random-mode"
            >
            <p>Or maybe you prefer random level and topics:</p>
            </label>
            <Switch
              id="random-mode"
              onChange={(e) => handleChange('randomMode', e)}
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
              onChange={(e) => handleChange('storageMode', e.target.value)}
            />
          </div>
          <Divider />
          <div className="flex flex-col w-[150px] self-center">
            <Button type="primary" htmlType="submit" disabled={isSaveDisabled()}>Submit</Button>
          </div>
        </div>
      </form>
    </Drawer>
  )
}
