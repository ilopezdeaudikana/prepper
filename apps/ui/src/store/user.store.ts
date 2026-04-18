import { create } from 'zustand'

export interface UserStore {
  user: string
  setUser: (user: string) => void
  resetUser: () => void
}

export const useUser = create<UserStore>((set) => ({
  user: '',
  setUser: (user: string) => set(_ => ({ user })),
  resetUser: () => set(_ => ({ user: '' }))
}))