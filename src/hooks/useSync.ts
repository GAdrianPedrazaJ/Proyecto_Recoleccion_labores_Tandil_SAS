import { useCallback, useEffect, useState } from 'react'
import { countNoSincronizados } from '../services/db'
import { syncFromRemote, syncPendientes } from '../services/sync'

export function useSync() {
  const [pendingCount, setPendingCount] = useState(0)
  const [syncing, setSyncing] = useState(false)

  const refresh = useCallback(async () => {
    const count = await countNoSincronizados()
    setPendingCount(count)
  }, [])

  const sync = useCallback(async () => {
    if (syncing) return
    setSyncing(true)
    try {
      await syncFromRemote()
      window.dispatchEvent(new Event('sync:remote:done'))
      await syncPendientes()
      await refresh()
    } finally {
      setSyncing(false)
    }
  }, [syncing, refresh])

  useEffect(() => {
    // Descargar datos maestros al iniciar si hay conexión
    if (navigator.onLine) {
      syncFromRemote()
        .then(() => window.dispatchEvent(new Event('sync:remote:done')))
        .catch(() => {})
    }
    refresh()

    const interval = setInterval(() => {
      if (navigator.onLine) sync()
    }, 30_000)

    const handleOnline = () => sync()
    window.addEventListener('online', handleOnline)

    return () => {
      clearInterval(interval)
      window.removeEventListener('online', handleOnline)
    }
  }, [refresh, sync])

  return { pendingCount, syncing, sync, refresh }
}
