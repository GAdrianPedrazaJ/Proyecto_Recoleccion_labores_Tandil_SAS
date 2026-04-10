import { useEffect, useState } from 'react'
import { onSyncStatsChange, startSync, type SyncStats } from '../services/syncQueue'

export interface UseSyncQueueReturn extends SyncStats {
  syncNow: () => void
}

export function useSyncQueue(): UseSyncQueueReturn {
  const [stats, setStats] = useState<SyncStats>({
    isOnline: navigator.onLine,
    isSyncing: false,
    total: 0,
    pending: 0,
    syncing: 0,
    synced: 0,
    failed: 0,
  })

  useEffect(() => {
    const unsubscribe = onSyncStatsChange(setStats)
    return unsubscribe
  }, [])

  return {
    ...stats,
    syncNow: () => startSync(),
  }
}
