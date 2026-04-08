import { create } from 'zustand'
import type { FormularioDia } from '../types'

/** Estado global de app: supervisor, sede, registros del día y conectividad. */
interface AppState {
  supervisor: string
  sede: string
  registrosHoy: FormularioDia[]
  areas: any[]
  isOnline: boolean
  setAreas: (areas: any[]) => void
  setSupervisor: (v: string) => void
  setSede: (v: string) => void
  setRegistrosHoy: (rows: FormularioDia[]) => void
  setIsOnline: (v: boolean) => void
}

export const useAppStore = create<AppState>((set) => ({
  supervisor: '',
  sede: '',
  registrosHoy: [],
  areas: [],
  isOnline: typeof navigator !== 'undefined' ? navigator.onLine : true,
  setAreas: (areas) => set({ areas }),
  setSupervisor: (supervisor) => set({ supervisor }),
  setSede: (sede) => set({ sede }),
  setRegistrosHoy: (registrosHoy) => set({ registrosHoy }),
  setIsOnline: (isOnline) => set({ isOnline }),
}))
