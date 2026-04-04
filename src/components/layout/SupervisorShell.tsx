import { useOffline } from '../../hooks/useOffline'
import { useSync } from '../../hooks/useSync'
import { SupervisorLayout } from './SupervisorLayout'

export function SupervisorShell() {
  const sync = useOffline()
  useSync()
  return (
    <SupervisorLayout
      sync={{
        isOnline: sync.isOnline,
        isSyncing: sync.isSyncing,
        pendingCount: sync.pendingCount,
      }}
    />
  )
}
