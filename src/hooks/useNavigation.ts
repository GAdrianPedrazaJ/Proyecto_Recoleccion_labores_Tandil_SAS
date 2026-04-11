import { useCallback } from 'react'
import { useNavigationStore, type PageName } from '../store/useNavigationStore'

/**
 * Hook de navegación que reemplaza useNavigate()
 * Usa el store de navegación para ocultar las URLs reales
 * Acepta nombres de página directamente o URLs para convertir
 */
export function useNavigation() {
  const { goTo, back } = useNavigationStore()

  const navigate = useCallback(
    ((to: string | number | { pathname: string }, params?: Record<string, string | number | undefined>) => {
      if (typeof to === 'number') {
        // -1 para ir atrás
        if (to === -1) {
          back()
        }
        return
      }

      // Si ya es un nombre de página conocido, usarlo directamente
      const pathname = typeof to === 'string' ? to : to.pathname
      const pageNames: PageName[] = [
        'login',
        'admin-setup',
        'areas',
        'area-detail',
        'nuevo-registro',
        'registro',
        'historial',
        'supervisor-gestionar',
        'admin-dashboard',
        'admin-areas',
        'admin-colaboradores',
        'admin-bloques',
        'admin-variedades',
        'admin-supervisores',
        'admin-labores',
        'admin-estadisticas',
        'admin-asignaciones',
      ]

      if (pageNames.includes(pathname as PageName)) {
        goTo(pathname as PageName, params || {})
        return
      }

      // Si es una URL, convertir a nombre de página
      const page = urlToPage(pathname)
      const finalParams = params || extractParams(pathname)
      goTo(page, finalParams)
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
  if (pathname === '/area-detail') return 'area-detail'
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
  const areaMatch = url.match(/\/area\/([^/]+)/)
  if (areaMatch) params.areaId = areaMatch[1]

  // Extraer formularioId
  const formMatch = url.match(/\/registro\/([^/]+)/)
  if (formMatch) params.formularioId = formMatch[1]

  return params
}
