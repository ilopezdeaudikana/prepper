import { create } from 'zustand'

export const FINAL_STAGE = 5

export const INITIAL_STAGE = -1


export interface ProgressStore {
  progress: { score: number; stage: number }
  setProgress: (newProgress: { score: number; stage: number }) => void
  resetProgress: () => void
}

export const useProgress = create<ProgressStore>((set) => ({
  progress: { score: 0, stage: INITIAL_STAGE },
  setProgress: (newProgress: { score: number; stage: number }) => set({ progress: newProgress }),
  resetProgress: () => set({ progress: { score: 0, stage: INITIAL_STAGE } })
}))


