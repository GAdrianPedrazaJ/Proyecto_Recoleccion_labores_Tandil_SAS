import { useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { type PageName } from '../store/useNavigationStore'

/**
 * Hook de navegación que mantiene compatibilidad con el sistema anterior
 * pero utiliza react-router-dom internamente.
 */
export function useNavigation() {
  const navigate = useNavigate()

  const nav = useCallback(
    (to: string | number | { pathname: string }, params?: Record<string, string | number | undefined>) => {
      if (typeof to === 'number') {
        navigate(to)
        return
      }

      const pathname = typeof to === 'string' ? to : to.pathname

      // Mapeo de PageName a rutas reales
      const pageToPath: Record<string, string> = {
        'login': '/login',
        'admin-setup': '/admin-setup',
        'areas': '/areas',
        'area-detail': '/area/:areaId',
        'planeacion': '/planeacion',
        'select-tipo': '/select-tipo',
        'formulario-corte': '/formulario-corte',
        'formulario-labores': '/formulario-labores',
        'formulario-aseguramiento': '/formulario-aseguramiento',
        'nuevo-registro': '/nuevo-registro',
        'historial': '/historial',
        'supervisor-gestionar': '/supervisor/gestionar',
        'admin-dashboard': '/admin',
        'admin-areas': '/admin/areas',
        'admin-colaboradores': '/admin/colaboradores',
        'admin-bloques': '/admin/bloques',
        'admin-variedades': '/admin/variedades',
        'admin-supervisores': '/admin/supervisores',
        'admin-labores': '/admin/labores',
        'admin-asignaciones': '/admin/asignaciones',
        'admin-sedes': '/admin/sedes',
        'superadmin-usuarios': '/admin/usuarios',
      }

      let targetPath = pageToPath[pathname] || pathname

      // Reemplazar parámetros en el path si existen (ej: :areaId)
      if (params) {
        Object.entries(params).forEach(([key, value]) => {
          if (value !== undefined) {
            targetPath = targetPath.replace(`:${key}`, String(value))
          }
        })

        // Si después de reemplazar sobran parámetros, añadirlos como query string si es necesario
        // Pero para este proyecto parece que se usan principalmente para rutas dinámicas o estado temporal
      }

      // Manejo especial para area-detail que se usaba con params.areaId
      if (pathname === 'area-detail' && params?.areaId) {
        targetPath = `/area/${params.areaId}`
      }

      navigate(targetPath)
    },
    [navigate],
  )

  return nav
}
