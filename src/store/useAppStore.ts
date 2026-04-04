import { create } from 'zustand'
import type { Usuario } from '../types'
import { getUsuarioByUsername } from '../services/db'

const STORAGE_KEY = 'labores-user'

function loadUsuarioFromStorage(): Usuario | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return null
    return JSON.parse(raw) as Usuario
  } catch {
    return null
  }
}

interface AppState {
  usuarioActual: Usuario | null
  isOnline: boolean
  isSyncing: boolean
  setUsuarioActual: (u: Usuario | null) => void
  setIsOnline: (v: boolean) => void
  setIsSyncing: (v: boolean) => void
  login: (username: string, password: string) => Promise<boolean>
  logout: () => void
  hydrateFromStorage: () => void
}

export const useAppStore = create<AppState>((set) => ({
  usuarioActual: null,
  isOnline: typeof navigator !== 'undefined' ? navigator.onLine : true,
  isSyncing: false,

  setUsuarioActual: (usuarioActual) => set({ usuarioActual }),
  setIsOnline: (isOnline) => set({ isOnline }),
  setIsSyncing: (isSyncing) => set({ isSyncing }),

  hydrateFromStorage: () => {
    const u = loadUsuarioFromStorage()
    if (u) set({ usuarioActual: u })
  },

  login: async (username, password) => {
    const u = await getUsuarioByUsername(username.trim())
    if (!u || !u.activo) return false
    if (u.passwordHash !== password) return false
    localStorage.setItem(STORAGE_KEY, JSON.stringify(u))
    set({ usuarioActual: u })
    return true
  },

  logout: () => {
    localStorage.removeItem(STORAGE_KEY)
    set({ usuarioActual: null })
  },
}))
