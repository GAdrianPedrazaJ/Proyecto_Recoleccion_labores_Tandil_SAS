import { useEffect } from 'react'
import { useLocation } from 'react-router-dom'
import { useAuthStore } from './store/useAuthStore'
import { useNavigationStore, type PageName } from './store/useNavigationStore'
import AreaSelector from './pages/AreaSelector'
import AreaDetalle from './pages/AreaDetalle'
import NuevoRegistro from './pages/NuevoRegistro'
import Historial from './pages/Historial'
import Login from './pages/Login'
import AdminSetup from './pages/AdminSetup'
import AdminDashboard from './pages/admin/Dashboard'
import AdminAreas from './pages/admin/Areas'
import AdminColaboradores from './pages/admin/Colaboradores'
import AdminBloques from './pages/admin/Bloques'
import AdminVariedades from './pages/admin/Variedades'
import AdminSupervisores from './pages/admin/Supervisores'
import AdminLabores from './pages/admin/Labores'
import AdminEstadisticas from './pages/admin/Estadisticas'
import AdminAsignaciones from './pages/admin/Asignaciones'
import SupervisorGestionar from './pages/supervisor/Gestionar'
import { SyncProgressModal } from './components/ui/SyncProgressModal'

// Mapeo de rutas URL a nombres de página
const PATH_TO_PAGE: Record<string, PageName> = {
  '/login': 'login',
  '/admin-setup': 'admin-setup',
  '/areas': 'areas',
  '/area-detail': 'area-detail',
  '/nuevo-registro': 'nuevo-registro',
  '/registro': 'registro',
  '/historial': 'historial',
  '/supervisor-gestionar': 'supervisor-gestionar',
  '/admin': 'admin-dashboard',
  '/admin/estadisticas': 'admin-estadisticas',
  '/admin/asignaciones': 'admin-asignaciones',
  '/admin/areas': 'admin-areas',
  '/admin/colaboradores': 'admin-colaboradores',
  '/admin/bloques': 'admin-bloques',
  '/admin/variedades': 'admin-variedades',
  '/admin/supervisores': 'admin-supervisores',
  '/admin/labores': 'admin-labores',
}

export default function App() {
  const { restoreSession } = useAuthStore()
  const { currentPage, goTo } = useNavigationStore()
  const location = useLocation()

  // Restaurar sesión al cargar
  useEffect(() => {
    restoreSession()
  }, [restoreSession])

  // Sincronizar URL con navegación por estado
  useEffect(() => {
    const path = location.pathname
    const page = PATH_TO_PAGE[path]
    if (page && currentPage !== page) {
      goTo(page)
    }
  }, [location.pathname, currentPage, goTo])

  // Renderizar página basada en estado - usar key para forzar remontaje
  return (
    <>
      {currentPage === 'login' && <Login />}
      {currentPage === 'admin-setup' && <AdminSetup />}

      {/* Páginas supervisors */}
      {currentPage === 'areas' && <AreaSelector />}
      {currentPage === 'area-detail' && <AreaDetalle />}
      {currentPage === 'nuevo-registro' && <NuevoRegistro />}
      {currentPage === 'registro' && <NuevoRegistro />}
      {currentPage === 'historial' && <Historial />}
      {currentPage === 'supervisor-gestionar' && <SupervisorGestionar />}

      {/* Páginas admin */}
      {currentPage === 'admin-dashboard' && <AdminDashboard />}
      {currentPage === 'admin-areas' && <AdminAreas />}
      {currentPage === 'admin-colaboradores' && <AdminColaboradores />}
      {currentPage === 'admin-bloques' && <AdminBloques />}
      {currentPage === 'admin-variedades' && <AdminVariedades />}
      {currentPage === 'admin-supervisores' && <AdminSupervisores />}
      {currentPage === 'admin-labores' && <AdminLabores />}
      {currentPage === 'admin-estadisticas' && <AdminEstadisticas />}
      {currentPage === 'admin-asignaciones' && <AdminAsignaciones />}

      {/* Modal de progreso de sincronización */}
      <SyncProgressModal />
    </>
  )
}

