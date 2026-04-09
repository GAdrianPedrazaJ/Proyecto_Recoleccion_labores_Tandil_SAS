import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuthStore } from '../../store/useAuthStore'
import { getUsuarioByUsername } from '../../services/db'
import { Button } from '../../components/ui/Button'
import { Input } from '../../components/ui/Input'

export default function AdminLogin() {
  const navigate = useNavigate()
  const login = useAuthStore((s) => s.login)
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      const user = await getUsuarioByUsername(username.trim())
      if (!user || user.passwordHash !== password || !user.activo) {
        setError('Usuario o contraseña incorrectos')
        return
      }
      login(user.username)
      navigate('/admin')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gray-50 px-4">
      <div className="w-full max-w-sm space-y-6">
        <div className="text-center">
          <span className="text-5xl" role="img" aria-label="Flor">🌷</span>
          <h1 className="mt-2 text-2xl font-bold text-gray-900">Labores Tandil</h1>
          <p className="text-sm text-gray-500">Acceso administrador</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 rounded-xl bg-white p-6 shadow-sm border border-gray-100">
          <Input
            label="Usuario"
            type="text"
            autoComplete="username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            required
          />
          <Input
            label="Contraseña"
            type="password"
            autoComplete="current-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
          {error && <p className="text-sm text-red-600">{error}</p>}
          <Button type="submit" className="w-full" loading={loading}>
            Ingresar
          </Button>
        </form>
      </div>
    </div>
  )
}
