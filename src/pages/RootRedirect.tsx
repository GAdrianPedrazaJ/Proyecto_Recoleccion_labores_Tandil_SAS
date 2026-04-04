import { Navigate } from 'react-router-dom'
import { useAppStore } from '../store/useAppStore'

export function RootRedirect() {
  const usuario = useAppStore((s) => s.usuarioActual)
  if (!usuario) return <Navigate to="/login" replace />
  if (usuario.rol === 'admin') return <Navigate to="/admin" replace />
  return <Navigate to="/supervisor" replace />
}
