import { useCallback } from 'react'
import { useNavigationStore, type PageName } from '../store/useNavigationStore'

/**
 * Hook de navegación que reemplaza useNavigate()
 * Usa el store de navegación para ocultar las URLs reales
 * Retorna una función compatible con useNavigate()
 */
export function useNavigation() {
  const { goTo, back } = useNavigationStore()

  const navigate = useCallback(
    ((to: string | number | { pathname: string }) => {
      if (typeof to === 'number') {
        // -1 para ir atrás
        if (to === -1) {
          back()
        }
        return
      }

      // Convertir ruta a nombre de página
      const pathname = typeof to === 'string' ? to : to.pathname
      const page = urlToPage(pathname)
      const params = extractParams(pathname)
      goTo(page, params)
    }) as any,
    [goTo, back],
  )

  return navigate
}

/**
 * Convertir URL a nombre de página
 */
function urlToPage(url: string): PageName {
  const pathname = url.split('?')[0] // Remover query strings

  if (pathname === '/login' || pathname === '/') return 'login'
  if (pathname === '/admin-setup') return 'admin-setup'
  if (pathname === '/areas') return 'areas'
  if (pathname === '/historial') return 'historial'
  if (pathname === '/supervisor/gestionar') return 'supervisor-gestionar'

  // Admin routes
  if (pathname === '/admin') return 'admin-dashboard'
  if (pathname === '/admin/areas') return 'admin-areas'
  if (pathname === '/admin/colaboradores') return 'admin-colaboradores'
  if (pathname === '/admin/bloques') return 'admin-bloques'
  if (pathname === '/admin/variedades') return 'admin-variedades'
  if (pathname === '/admin/supervisores') return 'admin-supervisores'
  if (pathname === '/admin/labores') return 'admin-labores'
  if (pathname === '/admin/estadisticas') return 'admin-estadisticas'
  if (pathname === '/admin/asignaciones') return 'admin-asignaciones'

  // Dynamic routes
  if (pathname.match(/^\/area\/\d+$/)) return 'area-detail'
  if (pathname.match(/^\/area\/\d+\/registro$/)) return 'nuevo-registro'
  if (pathname.match(/^\/registro\/\d+$/)) return 'registro'

  return 'login' // Default
}

/**
 * Extraer parámetros de la URL
 */
function extractParams(url: string): Record<string, string | number> {
  const params: Record<string, string | number> = {}

  // Extraer areaId
  const areaMatch = url.match(/\/area\/(\d+)/)
  if (areaMatch) params.areaId = parseInt(areaMatch[1])

  // Extraer formularioId
  const formMatch = url.match(/\/registro\/(\d+)/)
  if (formMatch) params.formularioId = parseInt(formMatch[1])

  return params
}
