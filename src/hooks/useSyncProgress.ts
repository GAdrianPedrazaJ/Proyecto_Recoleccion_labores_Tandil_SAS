import { useCallback } from 'react'
import {
  startSyncProgress,
  updateSyncProgress,
  addSyncError,
  endSyncProgress,
  clearSyncErrors,
} from '../services/syncProgress'

/**
 * Hook para manejar sincronización con progreso visual
 */
export function useSyncProgress() {
  const syncWithProgress = useCallback(
    async (
      syncFn: (
        onProgress: (processed: number, succeeded: number, failed: number, table?: string) => void,
        onError: (recordId: string, table: string, error: string) => void,
      ) => Promise<void>,
    ) => {
      clearSyncErrors()

      try {
        const onProgress = (p: number, s: number, f: number, table?: string) => {
          updateSyncProgress(p, s, f, table)
        }

        const onError = (recordId: string, table: string, error: string) => {
          addSyncError(recordId, table, error)
        }

        // Mostrar modal
        startSyncProgress(0) // Total se determinará en el callback

        // Ejecutar sincronización
        await syncFn(onProgress, onError)

        // Finalizar
        endSyncProgress()
      } catch (error) {
        const msg = error instanceof Error ? error.message : 'Error desconocido'
        addSyncError('unknown', 'sync', msg)
        endSyncProgress()
      }
    },
    [],
  )

  return {
    syncWithProgress,
    clearErrors: clearSyncErrors,
  }
}
