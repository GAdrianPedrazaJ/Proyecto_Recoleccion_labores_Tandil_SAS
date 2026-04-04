import { Outlet, useNavigate } from 'react-router-dom'
import { BottomNav } from './BottomNav'
import { SyncIndicator, type SyncIndicatorState } from '../form/SyncIndicator'
import { useAppStore } from '../../store/useAppStore'
import { Button } from '../ui/Button'

export function SupervisorLayout({ sync }: { sync: SyncIndicatorState }) {
  const usuario = useAppStore((s) => s.usuarioActual)
  const logout = useAppStore((s) => s.logout)
  const navigate = useNavigate()
  return (
    <div className="flex min-h-dvh flex-col bg-surface pb-20">
      <header className="sticky top-0 z-20 flex items-center justify-between gap-2 border-b border-gray-200 bg-white/95 px-4 py-3 backdrop-blur">
        <div className="min-w-0">
          <p className="truncate text-sm text-gray-600">Hola,</p>
          <p className="truncate font-semibold text-ink">{usuario?.nombre ?? '—'}</p>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          <SyncIndicator
            isOnline={sync.isOnline}
            isSyncing={sync.isSyncing}
            pendingCount={sync.pendingCount}
          />
          <Button
            type="button"
            variant="ghost"
            className="!w-auto !min-h-9 px-2 text-xs"
            onClick={() => {
              logout()
              navigate('/login', { replace: true })
            }}
          >
            Salir
          </Button>
        </div>
      </header>
      <main className="flex-1">
        <Outlet />
      </main>
      <BottomNav />
    </div>
  )
}
