import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { loginUsuario, saveSession, getCurrentUsuario, logoutUsuario, type Usuario } from '../services/auth'

interface AuthStore {
  usuario: Usuario | null
  token: string | null
  isAuthenticated: boolean
  isLoading: boolean
  error: string | null

  // Actions
  login: (email: string, contraseña: string) => Promise<boolean>
  logout: () => void
  restoreSession: () => void
  clearError: () => void
}

export const useAuthStore = create<AuthStore>()(
  persist(
    (set) => ({
      usuario: null,
      token: null,
      isAuthenticated: false,
      isLoading: false,
      error: null,

      login: async (email: string, contraseña: string) => {
        set({ isLoading: true, error: null })
        try {
          const result = await loginUsuario(email, contraseña)
          if (result) {
            saveSession(result.usuario, result.token)
            set({
              usuario: result.usuario,
              token: result.token,
              isAuthenticated: true,
              isLoading: false,
            })
            return true
          } else {
            set({
              error: 'Email o contraseña inválidos',
              isLoading: false,
            })
            return false
          }
        } catch (error) {
          if (error instanceof Error && error.message === 'CUENTA_DESACTIVADA') {
            set({ error: 'Tu cuenta fue desactivada. Contacta al administrador.', isLoading: false })
          } else {
            const errorMsg = error instanceof Error ? error.message : 'Error al iniciar sesión'
            set({ error: errorMsg, isLoading: false })
          }
          return false
        }
      },

      logout: () => {
        logoutUsuario()
        set({
          usuario: null,
          token: null,
          isAuthenticated: false,
          error: null,
        })
        // Navegar a login (recarga limpia para resetear el navigation store)
        window.location.href = '/'
      },

      restoreSession: () => {
        const session = getCurrentUsuario()
        if (session) {
          set({
            usuario: session.usuario,
            token: session.token,
            isAuthenticated: true,
          })
        } else {
          set({
            usuario: null,
            token: null,
            isAuthenticated: false,
          })
        }
      },

      clearError: () => set({ error: null }),
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({
        usuario: state.usuario,
        token: state.token,
        isAuthenticated: state.isAuthenticated,
      }),
    },
  ),
)
