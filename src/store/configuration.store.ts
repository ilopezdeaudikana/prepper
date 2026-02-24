import { create } from 'zustand'

export interface Configuration {
  topic: string
  level: string
}

export interface ConfigurationStore {
  configuration: Configuration
  setConfiguration: (newConfig: Configuration) => void
  resetConfiguration: () => void
}

export const useConfiguration = create<ConfigurationStore>((set) => ({
  configuration: {
    topic: '',
    level: ''
  },
  setConfiguration: (newConfig: Configuration) => set({ configuration: newConfig }),
  resetConfiguration: () => set({ configuration: { topic: '', level: '' } })
}))