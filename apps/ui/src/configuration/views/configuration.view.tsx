import { useState } from 'react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { useConfiguration, type Configuration, type ConfigurationStore } from '@/store/configuration.store'
import { useNavigate } from 'react-router-dom'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'

export default function Configuration() {

  const [configuration, setLocalConfiguration] = useState<Configuration>({ topic: '', level: '' })

  const setConfiguration = useConfiguration((state: ConfigurationStore) => state.setConfiguration)

  const navigate = useNavigate()

  const handleChange = (key: string, value: string) => {
    setLocalConfiguration({ ...configuration, [key]: value })
  }

  const handleSubmit = async () => {
    const { topic, level } = configuration
    setConfiguration({
      topic: topic.trim(),
      level: level.trim()
    })
    navigate('/challenge')
  }

  return (
    <div className="max-w-1/2 flex flex-col mx-auto p-4 relative h-screen justify-between align-self-center">
      <form onSubmit={(e) => { e.preventDefault(); handleSubmit() }}>
        <div className="flex flex-col mb-2 gap-4">
          <div>
            <h1 className="text-2xl font-bold mb-2">Configure your FE challenge</h1>
            <p>Choose a topic and a difficulty level to start the challenge</p>
          </div>
          <div>
            <label htmlFor="topic">Topic</label>
            <Input
              name="topic"
              onChange={(e) => handleChange('topic', e.target.value)}
              className="mb-2 mt-4"
              value={configuration.topic}
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
            >
              <SelectTrigger>
                <SelectValue placeholder="Pick an option"/>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="junior">Junior</SelectItem>
                <SelectItem value="mid">Mid</SelectItem>
                <SelectItem value="senior">Senior</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <Button type="submit" disabled={!configuration.topic || !configuration.level}>Submit</Button>
        </div>
      </form>
    </div>
  )
}