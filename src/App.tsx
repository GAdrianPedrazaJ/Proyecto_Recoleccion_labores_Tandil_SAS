import { Outlet } from 'react-router-dom'
import { useEffect } from 'react'
import { Header } from './components/layout/Header'
import { BottomNav } from './components/layout/BottomNav'
import { useOffline } from './hooks/useOffline'
import { useSync } from './hooks/useSync'
import { getConfig } from './services/db'
import { useAppStore } from './store/useAppStore'

/**
 * Layout raíz: estado de red/sync, barra inferior y cabecera.
 * Carga supervisor/sede persistidos desde IndexedDB al iniciar.
 */
function AppLayout() {
  const syncState = useOffline()
  useSync()
  const setSupervisor = useAppStore((s) => s.setSupervisor)
  const setSede = useAppStore((s) => s.setSede)

  useEffect(() => {
    void getConfig('default').then((c) => {
      if (c) {
        setSupervisor(c.supervisor)
        setSede(c.sede)
      }
    })
  }, [setSupervisor, setSede])

  return (
    <div className="flex min-h-dvh flex-col bg-surface pb-20">
      <Header
        title="Labores Tandil"
        sync={{
          isOnline: syncState.isOnline,
          isSyncing: syncState.isSyncing,
          pendingCount: syncState.pendingCount,
        }}
      />
      <main className="flex-1">
        <Outlet />
      </main>
      <BottomNav />
    </div>
  )
}

export default AppLayout
