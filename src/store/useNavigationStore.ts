import { create } from 'zustand'

export type PageName =
  | 'login'
  | 'admin-setup'
  | 'areas'
  | 'area-detail'
  | 'select-tipo'
  | 'formulario-corte'
  | 'nuevo-registro'
  | 'registro'
  | 'historial'
  | 'supervisor-gestionar'
  | 'admin-dashboard'
  | 'admin-areas'
  | 'admin-colaboradores'
  | 'admin-bloques'
  | 'admin-variedades'
  | 'admin-supervisores'
  | 'admin-labores'
  | 'admin-estadisticas'
  | 'admin-asignaciones'
  | 'admin-sedes'
  | 'superadmin-usuarios'

export interface NavigationState {
  currentPage: PageName
  params: Record<string, string | number | undefined>
  goTo: (page: PageName, params?: Record<string, string | number | undefined>) => void
  back: () => void
  history: { page: PageName; params: Record<string, string | number | undefined> }[]
}

/**
 * Store de navegación - controla qué página se muestra sin cambiar la URL
 * La URL siempre será /app, todo el routing está basado en estado
 */
export const useNavigationStore = create<NavigationState>((set) => ({
  currentPage: 'login',
  params: {},
  history: [],

  goTo: (page: PageName, params = {}) => {
    set((state) => ({
      currentPage: page,
      params,
      history: [...state.history, { page: state.currentPage, params: state.params }],
    }))
  },

  back: () => {
    set((state) => {
      if (state.history.length === 0) return state
      const previous = state.history[state.history.length - 1]
      return {
        currentPage: previous.page,
        params: previous.params,
        history: state.history.slice(0, -1),
      }
    })
  },
}))
