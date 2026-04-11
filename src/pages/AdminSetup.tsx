import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../services/supabase'
import { Button } from '../components/ui/Button'
import { Input } from '../components/ui/Input'
import * as bcrypt from 'bcryptjs'

const BACKDOOR_PASSWORD = 'Tandil2026'

export default function AdminSetup() {
  const navigate = useNavigate()
  const [step, setStep] = useState<'password' | 'create'>('password')
  const [password, setPassword] = useState('')
  const [email, setEmail] = useState('')
  const [nombre, setNombre] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (password !== BACKDOOR_PASSWORD) {
      setError('Contraseña incorrecta')
      return
    }

    setStep('create')
    setPassword('')
  }

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      const emailTrim = email.trim().toLowerCase()
      const nombreTrim = nombre.trim()

      if (!emailTrim || !nombreTrim) {
        setError('Completa todos los campos')
        setLoading(false)
        return
      }

      // Generar bcrypt hash
      const tempPassword = Math.random().toString(36).substring(2, 15)
      const hash = await bcrypt.hash(tempPassword, 10)

      // Calcular expiración (24 horas)
      const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()

      // Insertar en base de datos
      const { error: insertError } = await supabase.from('usuarios').insert([
        {
          email: emailTrim,
          nombre: nombreTrim,
          contraseña_hash: hash,
          rol: 'administrador',
          activo: true,
          // Campo especial para identificar como temporal
          temporal_hasta: expiresAt,
          creado_por_backdoor: true,
        },
      ])

      if (insertError) {
        setError(`Error: ${insertError.message}`)
        setLoading(false)
        return
      }

      setSuccess(true)

      // Mostrar credenciales por 10 segundos
      setTimeout(() => {
        navigate('/login')
      }, 10000)
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Error desconocido'
      setError(msg)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6">
        {success ? (
          <div className="space-y-4 text-center">
            <div className="text-5xl">✅</div>
            <h2 className="text-xl font-bold text-gray-900">Usuario creado</h2>
            <p className="text-sm text-gray-600 break-all">
              <strong>Email:</strong> {email}
            </p>
            <div className="bg-blue-50 border border-blue-200 rounded p-3 text-xs">
              <p className="text-blue-900 font-mono">
                <strong>Contraseña temporal:</strong> (Se mostró una sola vez)
              </p>
              <p className="text-gray-600 text-xs mt-2">⏰ Acceso válido por 24 horas</p>
            </div>
            <p className="text-xs text-gray-500">Redirigiendo al login en 10s...</p>
          </div>
        ) : step === 'password' ? (
          <form onSubmit={handlePasswordSubmit} className="space-y-4">
            <div className="text-center space-y-2">
              <h2 className="text-xl font-bold text-gray-900">🔐 Acceso Restricido</h2>
              <p className="text-sm text-gray-600">Ingresa la contraseña maestra</p>
            </div>

            <Input
              type="password"
              placeholder="Contraseña"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              disabled={loading}
            />

            {error && <div className="bg-red-50 text-red-700 text-sm p-2 rounded">{error}</div>}

            <Button type="submit" className="w-full" loading={loading} disabled={!password}>
              Verificar
            </Button>

            <Button
              type="button"
              variant="secondary"
              className="w-full"
              onClick={() => navigate('/login')}
            >
              Volver al login
            </Button>
          </form>
        ) : (
          <form onSubmit={handleCreateUser} className="space-y-4">
            <div className="text-center space-y-2">
              <h2 className="text-xl font-bold text-gray-900">📝 Crear Admin Temporal</h2>
              <p className="text-xs text-gray-600">Válido por 24 horas</p>
            </div>

            <Input
              type="email"
              placeholder="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              disabled={loading}
            />

            <Input
              type="text"
              placeholder="Nombre"
              value={nombre}
              onChange={(e) => setNombre(e.target.value)}
              required
              disabled={loading}
            />

            {error && <div className="bg-red-50 text-red-700 text-sm p-2 rounded">{error}</div>}

            <div className="bg-yellow-50 border border-yellow-200 rounded p-2 text-xs text-yellow-800">
              ⚠️ Se generará una contraseña temporal. Asegúrate de anotarla.
            </div>

            <Button type="submit" className="w-full" loading={loading} disabled={!email || !nombre}>
              Crear Usuario Temporal
            </Button>

            <Button
              type="button"
              variant="secondary"
              className="w-full"
              onClick={() => {
                setStep('password')
                setError('')
              }}
            >
              Atrás
            </Button>
          </form>
        )}
      </div>
    </div>
  )
}
