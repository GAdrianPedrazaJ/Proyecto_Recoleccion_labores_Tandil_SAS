import { create } from 'zustand'
import type { Usuario } from '../types'
import { getUsuarioByUsername, seedIfEmpty } from '../services/db'

const STORAGE_KEY = 'labores-usuario'

interface AppState {
  usuarioActual: Usuario | null
  isOnline: boolean
  isSyncing: boolean
  login: (username: string, password: string) => Promise<boolean>
  logout: () => void
  hydrateFromStorage: () => void
  setIsOnline: (v: boolean) => void
  setIsSyncing: (v: boolean) => void
}

export const useAppStore = create<AppState>((set) => ({
  usuarioActual: null,
  isOnline: typeof navigator !== 'undefined' ? navigator.onLine : true,
  isSyncing: false,

  login: async (username, password) => {
    await seedIfEmpty()
    const user = await getUsuarioByUsername(username)
    if (!user || user.passwordHash !== password || !user.activo) return false
    set({ usuarioActual: user })
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(user))
    } catch { /* quota */ }
    return true
  },

  logout: () => {
    set({ usuarioActual: null })
    localStorage.removeItem(STORAGE_KEY)
  },

  hydrateFromStorage: () => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY)
      if (raw) {
        const user: Usuario = JSON.parse(raw)
        set({ usuarioActual: user })
      }
    } catch { /* corrupt */ }
  },

  setIsOnline: (isOnline) => set({ isOnline }),
  setIsSyncing: (isSyncing) => set({ isSyncing }),
}))
