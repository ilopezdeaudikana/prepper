import { create } from 'zustand'

export interface ConfigurationState {
  topic: string
  level: string
  randomMode: boolean
  storageMode?: boolean
}

export interface ConfigurationStore {
  configuration: ConfigurationState
  setConfiguration: (newConfig: ConfigurationState) => void
  resetConfiguration: () => void
}

export const useConfiguration = create<ConfigurationStore>((set) => ({
  configuration: {
    topic: '',
    level: '',
    randomMode: false
  },
  setConfiguration: (newConfig: ConfigurationState) => set({ configuration: newConfig }),
  resetConfiguration: () => set({ configuration: { topic: '', level: '', randomMode: false } })
}))