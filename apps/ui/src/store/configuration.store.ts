import { create } from 'zustand'
import { ChallengeType, type LevelType } from '@repo/shared-types'

export interface ConfigurationState {
  topic: string
  level?: LevelType
  type: ChallengeType
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
    level: undefined,
    type: 'mixed',
    randomMode: false
  },
  setConfiguration: (newConfig: ConfigurationState) => set({ configuration: newConfig }),
  resetConfiguration: () => set({ configuration: { topic: '', type: 'mixed', level: undefined, randomMode: false } })
}))