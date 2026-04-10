import type { ReactNode } from 'react'
import { useEffect } from 'react'
import { Navigate, Route, Routes } from 'react-router-dom'
import { useAuthStore } from './store/useAuthStore'
import AreaSelector from './pages/AreaSelector'
import AreaDetalle from './pages/AreaDetalle'
import NuevoRegistro from './pages/NuevoRegistro'
import Historial from './pages/Historial'
import Login from './pages/Login'
import AdminDashboard from './pages/admin/Dashboard'
import AdminAreas from './pages/admin/Areas'
import AdminColaboradores from './pages/admin/Colaboradores'
import AdminBloques from './pages/admin/Bloques'
import AdminVariedades from './pages/admin/Variedades'
import AdminSupervisores from './pages/admin/Supervisores'
import AdminLabores from './pages/admin/Labores'
import AdminEstadisticas from './pages/admin/Estadisticas'
import AdminAsignaciones from './pages/admin/Asignaciones'

/** Protector de rutas: verifica que sea supervisor o admin */
function SupervisorRoute({ children }: { children: ReactNode }) {
  const { usuario, isAuthenticated } = useAuthStore()

  if (!isAuthenticated || !usuario) {
    return <Navigate to="/login" replace />
  }

  // Supervisor o admin pueden acceder
  if (usuario.rol !== 'supervisor' && usuario.rol !== 'administrador') {
    return <Navigate to="/login" replace />
  }

  return <>{children}</>
}

/** Protector de rutas: solo administrador */
function AdminRoute({ children }: { children: ReactNode }) {
  const { usuario, isAuthenticated } = useAuthStore()

  if (!isAuthenticated || !usuario) {
    return <Navigate to="/login" replace />
  }

  if (usuario.rol !== 'administrador') {
    return <Navigate to="/areas" replace />
  }

  return <>{children}</>
}

export default function App() {
  const { restoreSession } = useAuthStore()

  // Restaurar sesión al cargar
  useEffect(() => {
    restoreSession()
  }, [restoreSession])

  return (
    <Routes>
      {/* Login - accesible para todos */}
      <Route path="/login" element={<Login />} />

      {/* Supervisor routes - supervisor y admin pueden acceder */}
      <Route path="/areas" element={<SupervisorRoute><AreaSelector /></SupervisorRoute>} />
      <Route path="/area/:areaId" element={<SupervisorRoute><AreaDetalle /></SupervisorRoute>} />
      <Route path="/area/:areaId/registro" element={<SupervisorRoute><NuevoRegistro /></SupervisorRoute>} />
      <Route path="/registro/:formularioId" element={<SupervisorRoute><NuevoRegistro /></SupervisorRoute>} />
      <Route path="/historial" element={<SupervisorRoute><Historial /></SupervisorRoute>} />

      {/* Admin routes - solo administrador */}
      <Route path="/admin" element={<AdminRoute><AdminDashboard /></AdminRoute>} />
      <Route path="/admin/areas" element={<AdminRoute><AdminAreas /></AdminRoute>} />
      <Route path="/admin/colaboradores" element={<AdminRoute><AdminColaboradores /></AdminRoute>} />
      <Route path="/admin/bloques" element={<AdminRoute><AdminBloques /></AdminRoute>} />
      <Route path="/admin/variedades" element={<AdminRoute><AdminVariedades /></AdminRoute>} />
      <Route path="/admin/supervisores" element={<AdminRoute><AdminSupervisores /></AdminRoute>} />
      <Route path="/admin/labores" element={<AdminRoute><AdminLabores /></AdminRoute>} />
      <Route path="/admin/estadisticas" element={<AdminRoute><AdminEstadisticas /></AdminRoute>} />
      <Route path="/admin/asignaciones" element={<AdminRoute><AdminAsignaciones /></AdminRoute>} />

      {/* Root redirects to login */}
      <Route path="/" element={<Navigate to="/login" replace />} />

      {/* Fallback */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}

