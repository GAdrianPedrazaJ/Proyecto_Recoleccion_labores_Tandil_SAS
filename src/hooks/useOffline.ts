import { useCallback, useEffect, useState } from 'react'
import { countNoSincronizados } from '../services/db'
import { syncPendientes } from '../services/sync'
import { useAppStore } from '../store/useAppStore'

/**
 * Escucha online/offline, actualiza el store y al volver online ejecuta syncPendientes().
 * Devuelve isOnline, isSyncing y cantidad de registros aún no sincronizados.
 */
export function useOffline(): {
  isOnline: boolean
  isSyncing: boolean
  pendingCount: number
  refreshPending: () => Promise<void>
} {
  const setIsOnline = useAppStore((s) => s.setIsOnline)
  const [isSyncing, setIsSyncing] = useState(false)
  const [pendingCount, setPendingCount] = useState(0)
  const isOnline = useAppStore((s) => s.isOnline)

  const refreshPending = useCallback(async () => {
    const n = await countNoSincronizados()
    setPendingCount(n)
  }, [])

  const runSync = useCallback(async () => {
    if (!navigator.onLine) return
    setIsSyncing(true)
    try {
      await syncPendientes()
    } finally {
      setIsSyncing(false)
      await refreshPending()
    }
  }, [refreshPending])

  useEffect(() => {
    const onOnline = () => {
      setIsOnline(true)
      void runSync()
    }
    const onOffline = () => setIsOnline(false)

    setIsOnline(navigator.onLine)
    void refreshPending()

    const onLaboresSync = () => void refreshPending()
    window.addEventListener('online', onOnline)
    window.addEventListener('offline', onOffline)
    window.addEventListener('labores:sync', onLaboresSync)
    return () => {
      window.removeEventListener('online', onOnline)
      window.removeEventListener('offline', onOffline)
      window.removeEventListener('labores:sync', onLaboresSync)
    }
  }, [setIsOnline, runSync, refreshPending])

  return { isOnline, isSyncing, pendingCount, refreshPending }
}
