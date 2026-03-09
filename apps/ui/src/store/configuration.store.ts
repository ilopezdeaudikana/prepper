import { create } from 'zustand'

export interface Configuration {
  topic: string
  level: string
  randomMode: boolean
  storageMode?: boolean
}

export interface ConfigurationStore {
  configuration: Configuration
  setConfiguration: (newConfig: Configuration) => void
  resetConfiguration: () => void
}

export const useConfiguration = create<ConfigurationStore>((set) => ({
  configuration: {
    topic: '',
    level: '',
    randomMode: false
  },
  setConfiguration: (newConfig: Configuration) => set({ configuration: newConfig }),
  resetConfiguration: () => set({ configuration: { topic: '', level: '', randomMode: false } })
}))