import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuthStore } from '../store/useAuthStore'
import { Header } from '../components/layout/Header'
import { Button } from '../components/ui/Button'
import { Input } from '../components/ui/Input'

export default function Login() {
  const navigate = useNavigate()
  const { usuario, isAuthenticated, isLoading, error, login, clearError } = useAuthStore()
  const [email, setEmail] = useState('')
  const [contraseña, setContraseña] = useState('')
  const [showPassword, setShowPassword] = useState(false)

  // Si ya está autenticado, redirigir según rol
  useEffect(() => {
    if (isAuthenticated && usuario) {
      if (usuario.rol === 'administrador') {
        navigate('/admin', { replace: true })
      } else {
        navigate('/areas', { replace: true })
      }
    }
  }, [isAuthenticated, usuario, navigate])

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    clearError()
    if (!email || !contraseña) {
      return
    }
    await login(email, contraseña)
  }

  return (
    <div className="flex min-h-screen flex-col bg-gradient-to-br from-green-50 to-blue-50">
      <Header title="Labores Tandil" />

      <main className="flex-1 flex items-center justify-center px-4 py-8">
        <div className="w-full max-w-md">
          {/* Card */}
          <div className="rounded-2xl bg-white shadow-lg p-6 sm:p-8 space-y-6">
            {/* Logo/Title */}
            <div className="text-center space-y-3">
              <div className="text-6xl mb-2">🌷</div>
              <h1 className="text-2xl font-bold text-gray-900">Acceso Labores</h1>
              <p className="text-sm text-gray-500">Inicia sesión con tu cuenta</p>
            </div>

            {/* Error */}
            {error && (
              <div className="rounded-lg bg-red-50 border border-red-200 p-3 text-sm text-red-700 flex items-start gap-2">
                <span className="font-semibold">Error:</span>
                <span>{error}</span>
              </div>
            )}

            {/* Form */}
            <form onSubmit={handleLogin} className="space-y-4">
              <Input
                label="Email"
                type="email"
                placeholder="usuario@tandil.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                disabled={isLoading}
              />

              <div className="relative">
                <Input
                  label="Contraseña"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="••••••••"
                  value={contraseña}
                  onChange={(e) => setContraseña(e.target.value)}
                  required
                  disabled={isLoading}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-8 text-gray-500 hover:text-gray-700"
                >
                  {showPassword ? '👁️' : '👁️‍🗨️'}
                </button>
              </div>

              <Button
                type="submit"
                className="w-full"
                size="lg"
                loading={isLoading}
                disabled={!email || !contraseña || isLoading}
              >
                {isLoading ? 'Ingresando...' : 'Ingresar'}
              </Button>
            </form>

            {/* Separador */}
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-300"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-white text-gray-500">Credenciales de prueba</span>
              </div>
            </div>

            {/* Demo credentials */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {/* Supervisor */}
              <div className="rounded-lg bg-blue-50 border border-blue-200 p-3 text-xs space-y-1">
                <p className="font-semibold text-blue-900">👤 Supervisor</p>
                <p className="text-blue-700">supervisor@tandil.com</p>
                <p className="text-blue-700">supervisor123</p>
              </div>

              {/* Admin */}
              <div className="rounded-lg bg-purple-50 border border-purple-200 p-3 text-xs space-y-1">
                <p className="font-semibold text-purple-900">👨‍💼 Administrador</p>
                <p className="text-purple-700">admin@tandil.com</p>
                <p className="text-purple-700">admin123</p>
              </div>
            </div>

            {/* Footer */}
            <div className="text-center text-xs text-gray-500 space-y-1">
              <p>🔒 Acceso protegido con encriptación</p>
              <p>Cada rol tiene permisos diferentes</p>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
