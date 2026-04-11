import { useEffect } from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import { useAuthStore } from './store/useAuthStore'
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
  const { restoreSession, usuario } = useAuthStore()

  useEffect(() => {
    restoreSession()
  }, [restoreSession])

  // Proteger rutas admin
  const isAdmin = usuario?.rol === 'administrador'

  return (
    <>
      <Routes>
        {/* Login */}
        <Route path="/login" element={<Login />} />
        <Route path="/admin-setup" element={<AdminSetup />} />

        {/* Supervisor pages */}
        <Route path="/areas" element={<AreaSelector />} />
        <Route path="/area/:id" element={<AreaDetalle />} />
        <Route path="/nuevo-registro" element={<NuevoRegistro />} />
        <Route path="/registro" element={<NuevoRegistro />} />
        <Route path="/historial" element={<Historial />} />
        <Route path="/supervisor/gestionar" element={<SupervisorGestionar />} />

        {/* Admin pages */}
        <Route path="/admin" element={isAdmin ? <AdminDashboard /> : <Navigate to="/" />} />
        <Route path="/admin/estadisticas" element={isAdmin ? <AdminEstadisticas /> : <Navigate to="/" />} />
        <Route path="/admin/asignaciones" element={isAdmin ? <AdminAsignaciones /> : <Navigate to="/" />} />
        <Route path="/admin/areas" element={isAdmin ? <AdminAreas /> : <Navigate to="/" />} />
        <Route path="/admin/colaboradores" element={isAdmin ? <AdminColaboradores /> : <Navigate to="/" />} />
        <Route path="/admin/bloques" element={isAdmin ? <AdminBloques /> : <Navigate to="/" />} />
        <Route path="/admin/variedades" element={isAdmin ? <AdminVariedades /> : <Navigate to="/" />} />
        <Route path="/admin/supervisores" element={isAdmin ? <AdminSupervisores /> : <Navigate to="/" />} />
        <Route path="/admin/labores" element={isAdmin ? <AdminLabores /> : <Navigate to="/" />} />

        {/* Default */}
        <Route path="/" element={usuario ? <Navigate to="/areas" /> : <Navigate to="/login" />} />
        <Route path="*" element={<Navigate to="/" />} />
      </Routes>

      <SyncProgressModal />
    </>
  )
}

