import type { ReactNode } from 'react'
import { Navigate, Route, Routes } from 'react-router-dom'
import { useAuthStore } from './store/useAuthStore'
import AreaSelector from './pages/AreaSelector'
import AreaDetalle from './pages/AreaDetalle'
import NuevoRegistro from './pages/NuevoRegistro'
import Historial from './pages/Historial'
import AdminLogin from './pages/admin/Login'
import AdminDashboard from './pages/admin/Dashboard'
import AdminAreas from './pages/admin/Areas'
import AdminColaboradores from './pages/admin/Colaboradores'
import AdminBloques from './pages/admin/Bloques'
import AdminVariedades from './pages/admin/Variedades'
import AdminSupervisores from './pages/admin/Supervisores'
import AdminLabores from './pages/admin/Labores'
import AdminEstadisticas from './pages/admin/Estadisticas'

function ProtectedRoute({ children }: { children: ReactNode }) {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated)
  if (!isAuthenticated) return <Navigate to="/admin/login" replace />
  return <>{children}</>
}

export default function App() {
  return (
    <Routes>
      {/* Flujo supervisor */}
      <Route path="/" element={<AreaSelector />} />
      <Route path="/area/:areaId" element={<AreaDetalle />} />
      <Route path="/area/:areaId/registro" element={<NuevoRegistro />} />
      <Route path="/registro/:formularioId" element={<NuevoRegistro />} />
      <Route path="/historial" element={<Historial />} />

      {/* Flujo admin */}
      <Route path="/admin/login" element={<AdminLogin />} />
      <Route path="/admin" element={<ProtectedRoute><AdminDashboard /></ProtectedRoute>} />
      <Route path="/admin/areas" element={<ProtectedRoute><AdminAreas /></ProtectedRoute>} />
      <Route path="/admin/colaboradores" element={<ProtectedRoute><AdminColaboradores /></ProtectedRoute>} />
      <Route path="/admin/bloques" element={<ProtectedRoute><AdminBloques /></ProtectedRoute>} />
      <Route path="/admin/variedades" element={<ProtectedRoute><AdminVariedades /></ProtectedRoute>} />
      <Route path="/admin/supervisores" element={<ProtectedRoute><AdminSupervisores /></ProtectedRoute>} />
      <Route path="/admin/labores" element={<ProtectedRoute><AdminLabores /></ProtectedRoute>} />
      <Route path="/admin/estadisticas" element={<ProtectedRoute><AdminEstadisticas /></ProtectedRoute>} />

      {/* Fallback */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}

