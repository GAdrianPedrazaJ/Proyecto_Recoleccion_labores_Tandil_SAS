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
import AdminAsignaciones from './pages/admin/Asignaciones'
import SupervisorGestionar from './pages/supervisor/Gestionar'
import { SyncProgressModal } from './components/ui/SyncProgressModal'

export default function App() {
  const { restoreSession, isAuthenticated, usuario } = useAuthStore()
  const { currentPage, goTo } = useNavigationStore()

  useEffect(() => {
    restoreSession()
  }, [restoreSession])

  // Guard: si no está autenticado y no está en página pública, enviar a login
  useEffect(() => {
    if (!isAuthenticated && currentPage !== 'login' && currentPage !== 'admin-setup') {
      goTo('login')
    }
  }, [isAuthenticated, currentPage, goTo])

  const isAdmin = usuario?.rol === 'administrador'

  const renderPage = () => {
    switch (currentPage) {
      case 'login':               return <Login />
      case 'admin-setup':         return <AdminSetup />

      // Páginas de supervisor
      case 'areas':               return isAuthenticated ? <AreaSelector />       : <Login />
      case 'area-detail':         return isAuthenticated ? <AreaDetalle />        : <Login />
      case 'nuevo-registro':
      case 'registro':            return isAuthenticated ? <NuevoRegistro />      : <Login />
      case 'historial':           return isAuthenticated ? <Historial />          : <Login />
      case 'supervisor-gestionar':return isAuthenticated ? <SupervisorGestionar />: <Login />

      // Páginas de admin
      case 'admin-dashboard':     return isAdmin ? <AdminDashboard />    : <Login />
      case 'admin-estadisticas':  return isAdmin ? <AdminDashboard />    : <Login />  // redirige a Dashboard unificado
      case 'admin-asignaciones':  return isAdmin ? <AdminAsignaciones /> : <Login />
      case 'admin-areas':         return isAdmin ? <AdminAreas />        : <Login />
      case 'admin-colaboradores': return isAdmin ? <AdminColaboradores />: <Login />
      case 'admin-bloques':       return isAdmin ? <AdminBloques />      : <Login />
      case 'admin-variedades':    return isAdmin ? <AdminVariedades />   : <Login />
      case 'admin-supervisores':  return isAdmin ? <AdminSupervisores /> : <Login />
      case 'admin-labores':       return isAdmin ? <AdminLabores />      : <Login />

      default: return <Login />
    }
  }

  return (
    <>
      {/* key fuerza el remontaje completo al cambiar de página */}
      <div key={currentPage} className="contents">
        {renderPage()}
      </div>
      <SyncProgressModal />
    </>
  )
}

