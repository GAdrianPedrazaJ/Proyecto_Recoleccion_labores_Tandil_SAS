import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { registerSW } from 'virtual:pwa-register'
import './index.css'
import { ToastProvider } from './context/ToastContext.tsx'
import { PrivateRoute } from './components/auth/PrivateRoute.tsx'
import { AdminShell } from './components/layout/AdminShell.tsx'
import { SupervisorShell } from './components/layout/SupervisorShell.tsx'
import { Login } from './pages/Login.tsx'
import { RootRedirect } from './pages/RootRedirect.tsx'
import { AdminDashboard } from './pages/admin/AdminDashboard.tsx'
import { AreasPage } from './pages/admin/AreasPage.tsx'
import { ColaboradoresPage } from './pages/admin/ColaboradoresPage.tsx'
import { UsuariosPage } from './pages/admin/UsuariosPage.tsx'
import { SupervisorDashboard } from './pages/supervisor/SupervisorDashboard.tsx'
import { NuevoRegistro } from './pages/supervisor/NuevoRegistro.tsx'
import { PendientesPage } from './pages/supervisor/PendientesPage.tsx'
import { HistorialPage } from './pages/supervisor/HistorialPage.tsx'
import { seedIfEmpty } from './services/db.ts'
import { useAppStore } from './store/useAppStore.ts'

registerSW({ immediate: true })

async function bootstrap() {
  await seedIfEmpty()
  useAppStore.getState().hydrateFromStorage()
}

void bootstrap().then(() => {
  createRoot(document.getElementById('root')!).render(
    <StrictMode>
      <BrowserRouter>
        <ToastProvider>
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
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </ToastProvider>
      </BrowserRouter>
    </StrictMode>,
  )
})
