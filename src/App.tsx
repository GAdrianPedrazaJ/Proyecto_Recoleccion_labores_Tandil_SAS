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

  return (
    <>
      <Routes>
        {/* Auth pages */}
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
        <Route path="/admin" element={usuario?.rol === 'administrador' ? <AdminDashboard /> : <Navigate to="/login" />} />
        <Route path="/admin/estadisticas" element={usuario?.rol === 'administrador' ? <AdminEstadisticas /> : <Navigate to="/login" />} />
        <Route path="/admin/asignaciones" element={usuario?.rol === 'administrador' ? <AdminAsignaciones /> : <Navigate to="/login" />} />
        <Route path="/admin/areas" element={usuario?.rol === 'administrador' ? <AdminAreas /> : <Navigate to="/login" />} />
        <Route path="/admin/colaboradores" element={usuario?.rol === 'administrador' ? <AdminColaboradores /> : <Navigate to="/login" />} />
        <Route path="/admin/bloques" element={usuario?.rol === 'administrador' ? <AdminBloques /> : <Navigate to="/login" />} />
        <Route path="/admin/variedades" element={usuario?.rol === 'administrador' ? <AdminVariedades /> : <Navigate to="/login" />} />
        <Route path="/admin/supervisores" element={usuario?.rol === 'administrador' ? <AdminSupervisores /> : <Navigate to="/login" />} />
        <Route path="/admin/labores" element={usuario?.rol === 'administrador' ? <AdminLabores /> : <Navigate to="/login" />} />

        {/* Default */}
        <Route path="/" element={usuario ? <Navigate to="/areas" /> : <Navigate to="/login" />} />
        <Route path="*" element={<Navigate to="/" />} />
      </Routes>

      <SyncProgressModal />
    </>
  )
}

