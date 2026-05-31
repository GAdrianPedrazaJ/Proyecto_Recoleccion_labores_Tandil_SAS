import { useEffect } from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import { useAuthStore } from './store/useAuthStore'
import { syncFromRemote } from './services/sync'
import { PWAInstallBanner } from './components/PWAInstallBanner'
import { ProtectedRoute } from './components/auth/ProtectedRoute'

// Páginas
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
  const { restoreSession, isAuthenticated } = useAuthStore()

  useEffect(() => {
    restoreSession()
  }, [restoreSession])

  // Sincronizar datos maestros solo cuando el usuario está autenticado y hay conexión
  useEffect(() => {
    if (navigator.onLine && isAuthenticated) {
      syncFromRemote()
        .then(() => window.dispatchEvent(new Event('sync:remote:done')))
        .catch((err) => console.error('Error en sincronización inicial:', err))
    }
  }, [isAuthenticated])

  return (
    <>
      <Routes>
        {/* Rutas Públicas */}
        <Route path="/login" element={!isAuthenticated ? <Login /> : <Navigate to="/" replace />} />
        <Route path="/admin-setup" element={<AdminSetup />} />

        {/* Rutas de Supervisor */}
        <Route path="/" element={<ProtectedRoute><AreaSelector /></ProtectedRoute>} />
        <Route path="/areas" element={<ProtectedRoute><AreaSelector /></ProtectedRoute>} />
        <Route path="/area/:areaId" element={<ProtectedRoute><AreaDetalle /></ProtectedRoute>} />
        <Route path="/planeacion" element={<ProtectedRoute><Planeacion /></ProtectedRoute>} />
        <Route path="/select-tipo" element={<ProtectedRoute><SelectTipo /></ProtectedRoute>} />
        <Route path="/formulario-corte" element={<ProtectedRoute><FormularioCorte /></ProtectedRoute>} />
        <Route path="/formulario-labores" element={<ProtectedRoute><FormularioLabores /></ProtectedRoute>} />
        <Route path="/formulario-aseguramiento" element={<ProtectedRoute><FormularioAseguramiento /></ProtectedRoute>} />
        <Route path="/nuevo-registro" element={<ProtectedRoute><NuevoRegistro /></ProtectedRoute>} />
        <Route path="/historial" element={<ProtectedRoute><Registros /></ProtectedRoute>} />
        <Route path="/supervisor/gestionar" element={<ProtectedRoute><SupervisorGestionar /></ProtectedRoute>} />

        {/* Rutas de Admin */}
        <Route path="/admin" element={
          <ProtectedRoute allowedRoles={['administrador', 'superadministrador']}>
            <AdminDashboard />
          </ProtectedRoute>
        } />
        <Route path="/admin/areas" element={
          <ProtectedRoute allowedRoles={['administrador', 'superadministrador']}>
            <AdminAreas />
          </ProtectedRoute>
        } />
        <Route path="/admin/colaboradores" element={
          <ProtectedRoute allowedRoles={['administrador', 'superadministrador']}>
            <AdminColaboradores />
          </ProtectedRoute>
        } />
        <Route path="/admin/bloques" element={
          <ProtectedRoute allowedRoles={['administrador', 'superadministrador']}>
            <AdminBloques />
          </ProtectedRoute>
        } />
        <Route path="/admin/variedades" element={
          <ProtectedRoute allowedRoles={['administrador', 'superadministrador']}>
            <AdminVariedades />
          </ProtectedRoute>
        } />
        <Route path="/admin/supervisores" element={
          <ProtectedRoute allowedRoles={['administrador', 'superadministrador']}>
            <AdminSupervisores />
          </ProtectedRoute>
        } />
        <Route path="/admin/labores" element={
          <ProtectedRoute allowedRoles={['administrador', 'superadministrador']}>
            <AdminLabores />
          </ProtectedRoute>
        } />
        <Route path="/admin/asignaciones" element={
          <ProtectedRoute allowedRoles={['administrador', 'superadministrador']}>
            <AdminAsignaciones />
          </ProtectedRoute>
        } />
        <Route path="/admin/sedes" element={
          <ProtectedRoute allowedRoles={['administrador', 'superadministrador']}>
            <AdminSedes />
          </ProtectedRoute>
        } />
        <Route path="/admin/usuarios" element={
          <ProtectedRoute allowedRoles={['superadministrador']}>
            <AdminGestionUsuarios />
          </ProtectedRoute>
        } />

        {/* Fallback */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>

      <SyncProgressModal />
      <PWAInstallBanner />
    </>
  )
}
