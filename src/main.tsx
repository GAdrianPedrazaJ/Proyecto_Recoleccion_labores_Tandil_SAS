import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import App from './App'
import { seedIfEmpty } from './services/db'
import './index.css'

// Registrar Service Worker para PWA solo en producción para evitar errores de MIME type en dev
if ('serviceWorker' in navigator && import.meta.env.PROD) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js', { scope: '/' })
      .then(reg => console.log('✓ Service Worker registrado', reg))
      .catch(err => console.warn('Service Worker no disponible:', err))
  })
}

// Inicializar IDB con datos de seed (usuario admin)
seedIfEmpty().catch(console.error)

const rootElement = document.getElementById('root')
if (!rootElement) throw new Error('Root element not found')

createRoot(rootElement).render(
  <StrictMode>
    <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
      <App />
    </BrowserRouter>
  </StrictMode>,
)
