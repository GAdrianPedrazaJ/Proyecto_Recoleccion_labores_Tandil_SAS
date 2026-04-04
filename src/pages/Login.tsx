import { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useNavigate } from 'react-router-dom'
import { useAppStore } from '../store/useAppStore'
import { useOffline } from '../hooks/useOffline'
import { useToast } from '../hooks/useToast'
import { SyncIndicator } from '../components/form/SyncIndicator'
import { Input } from '../components/ui/Input'
import { Button } from '../components/ui/Button'

const schema = z.object({
  username: z.string().min(1, 'Ingresa el usuario'),
  password: z.string().min(1, 'Ingresa la contraseña'),
})

type FormValues = z.infer<typeof schema>

export function Login() {
  const navigate = useNavigate()
  const usuario = useAppStore((s) => s.usuarioActual)
  const login = useAppStore((s) => s.login)
  const hydrate = useAppStore((s) => s.hydrateFromStorage)
  const { showToast } = useToast()
  const s = useOffline()

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { username: '', password: '' },
  })

  useEffect(() => {
    hydrate()
  }, [hydrate])

  useEffect(() => {
    if (!usuario) return
    navigate(usuario.rol === 'admin' ? '/admin' : '/supervisor', {
      replace: true,
    })
  }, [usuario, navigate])

  const onSubmit = async (data: FormValues) => {
    const ok = await login(data.username, data.password)
    if (!ok) {
      showToast('Usuario o contraseña incorrectos', 'error')
      return
    }
    const u = useAppStore.getState().usuarioActual
    navigate(u?.rol === 'admin' ? '/admin' : '/supervisor', { replace: true })
  }

  return (
    <div className="relative min-h-dvh bg-surface px-4 py-8">
      <div className="absolute right-4 top-4">
        <SyncIndicator
          isOnline={s.isOnline}
          isSyncing={s.isSyncing}
          pendingCount={s.pendingCount}
        />
      </div>
      <div className="mx-auto flex max-w-md flex-col items-center pt-8">
        <div className="mb-8 text-center">
          <div className="text-5xl" aria-hidden>
            🌹
          </div>
          <h1 className="mt-3 text-2xl font-bold text-ink">Labores Tandil</h1>
          <p className="mt-1 text-sm text-gray-600">Registro de labores — flores</p>
        </div>
        <form
          onSubmit={handleSubmit(onSubmit)}
          className="w-full rounded-2xl border border-gray-100 bg-white p-6 shadow-lg"
        >
          <h2 className="mb-4 text-center text-lg font-semibold text-ink">
            Ingresar
          </h2>
          <div className="space-y-4">
            <Input
              label="Usuario"
              autoComplete="username"
              {...register('username')}
              error={errors.username?.message}
            />
            <Input
              label="Contraseña"
              type="password"
              autoComplete="current-password"
              {...register('password')}
              error={errors.password?.message}
            />
          </div>
          <Button
            type="submit"
            className="mt-6 w-full"
            disabled={isSubmitting}
          >
            Ingresar
          </Button>
          <p className="mt-4 text-center text-xs text-gray-500">
            admin / admin123 · leidi / leidi123
          </p>
        </form>
      </div>
    </div>
  )
}
