import { useEffect, useState } from 'react'
import { useNavigation } from '../hooks/useNavigation'
import { useAuthStore } from '../store/useAuthStore'
import { Header } from '../components/layout/Header'
import { Button } from '../components/ui/Button'
import { Input } from '../components/ui/Input'

export default function Login() {
  const navigate = useNavigation()
  const { usuario, isAuthenticated, isLoading, error, login, clearError } = useAuthStore()
  const [email, setEmail] = useState('')
  const [contraseña, setContraseña] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [recordar, setRecordar] = useState(false)

  // Restaurar email y contraseña guardados al cargar
  useEffect(() => {
    const emailGuardado = localStorage.getItem('labores-email-recordado')
    const contraseñaGuardada = localStorage.getItem('labores-contraseña-recordada')
    if (emailGuardado) {
      setEmail(emailGuardado)
      setRecordar(true)
    }
    if (contraseñaGuardada) {
      setContraseña(contraseñaGuardada)
      setRecordar(true)
    }
  }, [])

  // Si ya está autenticado, redirigir según rol
  useEffect(() => {
    if (isAuthenticated && usuario) {
      if (usuario.rol === 'administrador' || usuario.rol === 'superadministrador') {
        navigate('admin-dashboard', { replace: true })
      } else {
        navigate('areas', { replace: true })
      }
    }
  }, [isAuthenticated, usuario, navigate])

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    clearError()
    if (!email || !contraseña) {
      return
    }
    // Guardar email y contraseña si el usuario marcó "Recordar"
    if (recordar) {
      localStorage.setItem('labores-email-recordado', email)
      localStorage.setItem('labores-contraseña-recordada', contraseña)
    } else {
      localStorage.removeItem('labores-email-recordado')
      localStorage.removeItem('labores-contraseña-recordada')
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

              {/* Checkbox Recordar */}
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="recordar"
                  checked={recordar}
                  onChange={(e) => setRecordar(e.target.checked)}
                  disabled={isLoading}
                  className="w-4 h-4 rounded border-gray-300 text-green-600 cursor-pointer"
                />
                <label htmlFor="recordar" className="text-sm text-gray-700 cursor-pointer">
                  Recordarme
                </label>
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

            {/* Footer */}
            <div className="text-center text-xs text-gray-400">
              🔒 Acceso protegido
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
