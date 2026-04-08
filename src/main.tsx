import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter, Route, Routes } from 'react-router-dom'
import { registerSW } from 'virtual:pwa-register'
import './index.css'
import { ToastProvider } from './context/ToastContext'
import { Login } from './pages/Login'
import { RootRedirect } from './pages/RootRedirect'
import { PrivateRoute } from './components/auth/PrivateRoute'
import { AdminShell } from './components/layout/AdminShell'
import { SupervisorShell } from './components/layout/SupervisorShell'
import { AdminDashboard } from './pages/admin/AdminDashboard'
import { AreasPage } from './pages/admin/AreasPage'
import { ColaboradoresPage } from './pages/admin/ColaboradoresPage'
import { UsuariosPage } from './pages/admin/UsuariosPage'
import { SupervisorDashboard } from './pages/supervisor/SupervisorDashboard'
import { NuevoRegistro } from './pages/supervisor/NuevoRegistro'
import { PendientesPage } from './pages/supervisor/PendientesPage'
import { HistorialPage } from './pages/supervisor/HistorialPage'
import { seedIfEmpty } from './services/db'
import { syncFromRemote } from './services/sync'

registerSW({ immediate: true })
void seedIfEmpty()
// Descarga áreas, colaboradores y variedades desde Google Sheets al iniciar
void syncFromRemote()

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ToastProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/" element={<RootRedirect />} />
          <Route
            path="/admin"
            element={
              <PrivateRoute role="admin">
                <AdminShell />
              </PrivateRoute>
            }
          >
            <Route index element={<AdminDashboard />} />
            <Route path="areas" element={<AreasPage />} />
            <Route path="colaboradores" element={<ColaboradoresPage />} />
            <Route path="usuarios" element={<UsuariosPage />} />
          </Route>
          <Route
            path="/supervisor"
            element={
              <PrivateRoute role="supervisor">
                <SupervisorShell />
              </PrivateRoute>
            }
          >
            <Route index element={<SupervisorDashboard />} />
            <Route path="nuevo" element={<NuevoRegistro />} />
            <Route path="pendientes" element={<PendientesPage />} />
            <Route path="historial" element={<HistorialPage />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </ToastProvider>
  </StrictMode>,
)
