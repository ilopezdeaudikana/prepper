import { useState } from 'react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { useConfiguration, type Configuration, type ConfigurationStore } from '@/store/configuration.store'
import { useNavigate } from 'react-router-dom'

export default function Configuration() {

  const [configuration, setLocalConfiguration] = useState<Configuration>({ topic: '', level: '' })

  const setConfiguration = useConfiguration((state: ConfigurationStore) => state.setConfiguration)

  const navigate = useNavigate()

  const handleChange = (key: string, value: string) => {
    setLocalConfiguration({ ...configuration, [key]: value })
  }

  const handleSubmit = async () => {
    const { topic, level } = configuration
    if (!topic || !level) return
    setConfiguration({
      topic: topic.trim(),
      level: level.trim()
    })
    navigate('/challenge')
  }

  return (
    <div className="max-w-1/2 flex flex-col mx-auto p-4 relative h-screen justify-between align-self-center">
      <form onSubmit={(e) => { e.preventDefault(); handleSubmit() }}>
        <div className="flex flex-col mb-2 gap-2">
          <div>
            <label htmlFor="topic">Topic</label>
            <Input
              name="topic"
              onChange={(e) => handleChange('topic', e.target.value)}
              className="mb-2 mt-4"
              value={configuration.topic}
            />
          </div>
          <div>
            <label htmlFor="level">Level</label>
            <Input
              name='level'
              onChange={(e) => handleChange('level', e.target.value)}
              className="mb-2 mt-4"
              value={configuration.level}
            />
          </div>
          <Button type="submit">Submit</Button>
        </div>
      </form>
    </div>
  )
}