import { useEffect } from 'react'
import { useAuthStore } from './store/useAuthStore'
import { useNavigationStore } from './store/useNavigationStore'
import { syncFromRemote } from './services/sync'
import { PWAInstallBanner } from './components/PWAInstallBanner'
import AreaSelector from './pages/AreaSelector'
import AreaDetalle from './pages/AreaDetalle'
import Planeacion from './pages/Planeacion'
import SelectTipo from './pages/SelectTipo'
import FormularioCorte from './pages/FormularioCorte'
import FormularioLabores from './pages/FormularioLabores'
import FormularioAseguramiento from './pages/FormularioAseguramiento'
import NuevoRegistro from './pages/NuevoRegistro'
import Registros from './pages/Registros'
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
import AdminSedes from './pages/admin/Sedes'
import AdminGestionUsuarios from './pages/admin/GestionUsuarios'
import SupervisorGestionar from './pages/supervisor/Gestionar'
import { SyncProgressModal } from './components/ui/SyncProgressModal'

export default function App() {
  const { restoreSession, isAuthenticated, usuario } = useAuthStore()
  const { currentPage, goTo } = useNavigationStore()

  useEffect(() => {
    restoreSession()
  }, [restoreSession])

  // Sincronizar datos maestros al iniciar (sedes, areas, colaboradores, etc.)
  useEffect(() => {
    if (navigator.onLine) {
      syncFromRemote()
        .then(() => window.dispatchEvent(new Event('sync:remote:done')))
        .catch(() => {})
    }
  }, [])

  // Guard: si no está autenticado y no está en página pública, enviar a login
  useEffect(() => {
    if (!isAuthenticated && currentPage !== 'login' && currentPage !== 'admin-setup') {
      goTo('login')
    }
  }, [isAuthenticated, currentPage, goTo])

  const isAdmin = usuario?.rol === 'administrador' || usuario?.rol === 'superadministrador'

  const renderPage = () => {
    switch (currentPage) {
      case 'login':               return <Login />
      case 'admin-setup':         return <AdminSetup />

      // Páginas de supervisor
      case 'areas':               return isAuthenticated ? <AreaSelector />       : <Login />
      case 'area-detail':         return isAuthenticated ? <AreaDetalle />        : <Login />
      case 'planeacion':          return isAuthenticated ? <Planeacion />         : <Login />
      case 'select-tipo':         return isAuthenticated ? <SelectTipo />         : <Login />
      case 'formulario-corte':    return isAuthenticated ? <FormularioCorte />    : <Login />
      case 'formulario-labores':  return isAuthenticated ? <FormularioLabores />  : <Login />
      case 'formulario-aseguramiento': return isAuthenticated ? <FormularioAseguramiento /> : <Login />
      case 'nuevo-registro':
      case 'registro':            return isAuthenticated ? <NuevoRegistro />      : <Login />
      case 'historial':           return isAuthenticated ? <Registros />          : <Login />
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
      case 'admin-sedes':         return isAdmin ? <AdminSedes />        : <Login />
      // Páginas exclusivas de superadministrador
      case 'superadmin-usuarios': return isAdmin ? <AdminGestionUsuarios /> : <Login />
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
      <PWAInstallBanner />
    </>
  )
}

