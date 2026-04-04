import { useCallback, useEffect, useRef } from 'react'
import { getSyncIntervalMs } from '../utils/helpers'
import { syncPendientes } from '../services/sync'
import { useAppStore } from '../store/useAppStore'

/**
 * Sincronización periódica según VITE_SYNC_INTERVAL_MS mientras `isOnline` en el store es true.
 * Montar `useOffline()` una sola vez en el layout para actualizar online/pending y evitar listeners duplicados.
 */
export function useSync() {
  const isOnline = useAppStore((s) => s.isOnline)
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const syncNow = useCallback(async () => {
    if (!navigator.onLine) return
    await syncPendientes()
    window.dispatchEvent(new CustomEvent('labores:sync'))
  }, [])

  useEffect(() => {
    if (!isOnline) {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
        intervalRef.current = null
      }
      return
    }
    const ms = getSyncIntervalMs()
    intervalRef.current = setInterval(() => {
      void syncNow()
    }, ms)
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current)
    }
  }, [isOnline, syncNow])

  return { syncNow }
}
