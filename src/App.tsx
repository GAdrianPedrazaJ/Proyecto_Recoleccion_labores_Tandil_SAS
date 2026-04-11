import { useEffect } from 'react'
import { useAuthStore } from './store/useAuthStore'
import { useNavigationStore } from './store/useNavigationStore'
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

export default function App() {
  const { restoreSession } = useAuthStore()
  const { currentPage } = useNavigationStore()

  // Restaurar sesión al cargar
  useEffect(() => {
    restoreSession()
  }, [restoreSession])

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

