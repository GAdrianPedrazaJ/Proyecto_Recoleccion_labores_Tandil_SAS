import type { ReactNode } from 'react'
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

/**
 * Protector de contenido: verifica que sea supervisor o admin
 * Redirige a login si no está autenticado
 */
function ProtectedSupervisor({ children }: { children: ReactNode }) {
  const { usuario, isAuthenticated } = useAuthStore()
  const { goTo } = useNavigationStore()

  if (!isAuthenticated || !usuario) {
    useEffect(() => {
      goTo('login')
    }, [goTo])
    return null
  }

  if (usuario.rol !== 'supervisor' && usuario.rol !== 'administrador') {
    useEffect(() => {
      goTo('login')
    }, [goTo])
    return null
  }

  return <>{children}</>
}

/**
 * Protector de contenido: solo administrador
 * Redirige a areas si no es admin
 */
function ProtectedAdmin({ children }: { children: ReactNode }) {
  const { usuario, isAuthenticated } = useAuthStore()
  const { goTo } = useNavigationStore()

  if (!isAuthenticated || !usuario) {
    useEffect(() => {
      goTo('login')
    }, [goTo])
    return null
  }

  if (usuario.rol !== 'administrador') {
    useEffect(() => {
      goTo('areas')
    }, [goTo])
    return null
  }

  return <>{children}</>
}

export default function App() {
  const { restoreSession } = useAuthStore()
  const { currentPage } = useNavigationStore()

  // Restaurar sesión al cargar
  useEffect(() => {
    restoreSession()
  }, [restoreSession])

  // Renderizar página basada en estado
  return (
    <>
      {currentPage === 'login' && <Login />}
      {currentPage === 'admin-setup' && <AdminSetup />}

      {/* Páginas supervisors */}
      {currentPage === 'areas' && (
        <ProtectedSupervisor>
          <AreaSelector />
        </ProtectedSupervisor>
      )}
      {currentPage === 'area-detail' && (
        <ProtectedSupervisor>
          <AreaDetalle />
        </ProtectedSupervisor>
      )}
      {currentPage === 'nuevo-registro' && (
        <ProtectedSupervisor>
          <NuevoRegistro />
        </ProtectedSupervisor>
      )}
      {currentPage === 'registro' && (
        <ProtectedSupervisor>
          <NuevoRegistro />
        </ProtectedSupervisor>
      )}
      {currentPage === 'historial' && (
        <ProtectedSupervisor>
          <Historial />
        </ProtectedSupervisor>
      )}
      {currentPage === 'supervisor-gestionar' && (
        <ProtectedSupervisor>
          <SupervisorGestionar />
        </ProtectedSupervisor>
      )}

      {/* Páginas admin */}
      {currentPage === 'admin-dashboard' && (
        <ProtectedAdmin>
          <AdminDashboard />
        </ProtectedAdmin>
      )}
      {currentPage === 'admin-areas' && (
        <ProtectedAdmin>
          <AdminAreas />
        </ProtectedAdmin>
      )}
      {currentPage === 'admin-colaboradores' && (
        <ProtectedAdmin>
          <AdminColaboradores />
        </ProtectedAdmin>
      )}
      {currentPage === 'admin-bloques' && (
        <ProtectedAdmin>
          <AdminBloques />
        </ProtectedAdmin>
      )}
      {currentPage === 'admin-variedades' && (
        <ProtectedAdmin>
          <AdminVariedades />
        </ProtectedAdmin>
      )}
      {currentPage === 'admin-supervisores' && (
        <ProtectedAdmin>
          <AdminSupervisores />
        </ProtectedAdmin>
      )}
      {currentPage === 'admin-labores' && (
        <ProtectedAdmin>
          <AdminLabores />
        </ProtectedAdmin>
      )}
      {currentPage === 'admin-estadisticas' && (
        <ProtectedAdmin>
          <AdminEstadisticas />
        </ProtectedAdmin>
      )}
      {currentPage === 'admin-asignaciones' && (
        <ProtectedAdmin>
          <AdminAsignaciones />
        </ProtectedAdmin>
      )}

      {/* Modal de progreso de sincronización */}
      <SyncProgressModal />
    </>
  )
}

