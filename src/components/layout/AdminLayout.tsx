import { Outlet, useNavigate } from 'react-router-dom'
import { AdminNav } from './AdminNav'
import { SyncIndicator, type SyncIndicatorState } from '../form/SyncIndicator'
import { useAppStore } from '../../store/useAppStore'
import { Button } from '../ui/Button'

export function AdminLayout({ sync }: { sync: SyncIndicatorState }) {
  const usuario = useAppStore((s) => s.usuarioActual)
  const logout = useAppStore((s) => s.logout)
  const navigate = useNavigate()

  return (
    <div className="flex min-h-dvh flex-col bg-surface md:flex-row">
      <aside className="md:min-h-dvh md:w-56 md:shrink-0">
        <AdminNav />
      </aside>
      <div className="flex min-h-0 min-w-0 flex-1 flex-col">
        <header className="flex flex-wrap items-center justify-between gap-2 border-b border-gray-200 bg-white px-4 py-3">
          <div>
            <p className="text-xs text-gray-500">Administrador</p>
            <p className="font-semibold text-ink">{usuario?.nombre ?? '—'}</p>
          </div>
          <div className="flex items-center gap-3">
            <SyncIndicator
              isOnline={sync.isOnline}
              isSyncing={sync.isSyncing}
              pendingCount={sync.pendingCount}
            />
            <Button
              variant="secondary"
              className="!min-h-9 !w-auto px-3 text-xs"
              onClick={() => {
                logout()
                navigate('/login', { replace: true })
              }}
            >
              Cerrar sesión
            </Button>
          </div>
        </header>
        <div className="flex-1 overflow-y-auto p-4">
          <Outlet />
        </div>
      </div>
    </div>
  )
}
