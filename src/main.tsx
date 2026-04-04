import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter, Route, Routes } from 'react-router-dom'
import { registerSW } from 'virtual:pwa-register'
import './index.css'
import AppLayout from './App.tsx'
import { Home } from './pages/Home.tsx'
import { NuevoRegistro } from './pages/NuevoRegistro.tsx'
import { RegistrosPendientes } from './pages/RegistrosPendientes.tsx'
import { Historial } from './pages/Historial.tsx'

registerSW({ immediate: true })

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter>
      <Routes>
        <Route element={<AppLayout />}>
          <Route path="/" element={<Home />} />
          <Route path="/nuevo" element={<NuevoRegistro />} />
          <Route path="/pendientes" element={<RegistrosPendientes />} />
          <Route path="/historial" element={<Historial />} />
        </Route>
      </Routes>
    </BrowserRouter>
  </StrictMode>,
)
