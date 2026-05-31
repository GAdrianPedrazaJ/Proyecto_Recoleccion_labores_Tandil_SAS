import { Navigate, useLocation } from 'react-router-dom'
import { useAuthStore } from '../../store/useAuthStore'
import { type Rol } from '../../services/auth'

interface ProtectedRouteProps {
  children: JSX.Element
  allowedRoles?: Rol[]
}

export function ProtectedRoute({ children, allowedRoles }: ProtectedRouteProps) {
  const { isAuthenticated, usuario, isLoading } = useAuthStore()
  const location = useLocation()

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
      </div>
    )
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />
  }

  if (allowedRoles && usuario && !allowedRoles.includes(usuario.rol)) {
    // Si es admin intentando entrar a algo de superadmin o similar
    return <Navigate to="/" replace />
  }

  return children
}
