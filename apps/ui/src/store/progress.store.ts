import { create } from 'zustand'

export interface ProgressStore {
  progress: { score: number; stage: number }
  setProgress: (newProgress: { score: number; stage: number }) => void
  resetProgress: () => void
}

export const useProgress = create<ProgressStore>((set) => ({
  progress: { score: 0, stage: 1 },
  setProgress: (newProgress: { score: number; stage: number }) => set({ progress: newProgress }),
  resetProgress: () => set({ progress: { score: 0, stage: 1 } })
}))


