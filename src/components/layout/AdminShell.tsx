import { useOffline } from '../../hooks/useOffline'
import { useSync } from '../../hooks/useSync'
import { AdminLayout } from './AdminLayout'

export function AdminShell() {
  const sync = useOffline()
  useSync()
  return (
    <AdminLayout
      sync={{
        isOnline: sync.isOnline,
        isSyncing: sync.isSyncing,
        pendingCount: sync.pendingCount,
      }}
    />
  )
}
