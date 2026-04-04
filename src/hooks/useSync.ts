import { useCallback, useEffect, useRef } from 'react'
import { getSyncIntervalMs } from '../utils/helpers'
import { syncPendientes } from '../services/sync'
import { useAppStore } from '../store/useAppStore'

export function useSync() {
  const isOnline = useAppStore((s) => s.isOnline)
  const setIsSyncing = useAppStore((s) => s.setIsSyncing)
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const syncNow = useCallback(async () => {
    if (!navigator.onLine) return
    setIsSyncing(true)
    try {
      await syncPendientes()
    } finally {
      setIsSyncing(false)
      window.dispatchEvent(new CustomEvent('labores:sync'))
    }
  }, [setIsSyncing])

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
