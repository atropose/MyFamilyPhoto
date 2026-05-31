import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { authApi } from '../lib/api'

interface AuthState {
  authenticated: boolean
  checkAuth: () => Promise<void>
  login: (passcode: string) => Promise<void>
  logout: () => Promise<void>
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      authenticated: false,
      checkAuth: async () => {
        try {
          const { data } = await authApi.status()
          set({ authenticated: data.authenticated })
        } catch {
          set({ authenticated: false })
        }
      },
      login: async (passcode: string) => {
        await authApi.login(passcode)
        set({ authenticated: true })
      },
      logout: async () => {
        await authApi.logout()
        set({ authenticated: false })
      },
    }),
    { name: 'auth', partialize: (s) => ({ authenticated: s.authenticated }) }
  )
)
