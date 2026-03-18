import { create } from 'zustand'
import type { User } from '../types/user'

interface AuthState {
  user:          User | null
  loading:       boolean
  initialized:   boolean
  setUser:       (user: User | null) => void
  setLoading:    (loading: boolean) => void
  setInitialized:(initialized: boolean) => void
  logout:        () => void
}

export const useAuthStore = create<AuthState>((set) => ({
  user:        null,
  loading:     true,
  initialized: false,

  setUser:        (user)        => set({ user }),
  setLoading:     (loading)     => set({ loading }),
  setInitialized: (initialized) => set({ initialized }),
  logout:         ()            => set({ user: null }),
}))
 
