import type { ReactNode } from 'react'
import { Navigate, useLocation } from 'react-router-dom'
import { useAppStore } from '../../store/useAppStore'

export function PrivateRoute({
  children,
  role,
}: {
  children: ReactNode
  role: 'admin' | 'supervisor'
}) {
  const usuario = useAppStore((s) => s.usuarioActual)
  const location = useLocation()

  if (!usuario) {
    return <Navigate to="/login" state={{ from: location }} replace />
  }
  if (usuario.rol !== role) {
    return (
      <Navigate
        to={usuario.rol === 'admin' ? '/admin' : '/supervisor'}
        replace
      />
    )
  }
  return children
}
