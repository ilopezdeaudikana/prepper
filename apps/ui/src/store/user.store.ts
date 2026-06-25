import { create } from 'zustand'

export interface UserStore {
  session: string
  recoveryPhrase?: string
  setUserSession: (session: string) => void
  setRecoveryPhrase: (phrase: string) => void
  resetUser: () => void
}

export const useUser = create<UserStore>((set) => ({
  recoveryPhrase: '',
  session: '',
  setUserSession: (session: string) => set(() => ({ session })),
  setRecoveryPhrase: (recoveryPhrase: string) => set(() => ({ recoveryPhrase })),
  resetUser: () => set(() => ({ recoveryPhrase: '', session: '' }))
}))