/**
 * Servicio de sincronización con detalles de progreso y errores
 */

export interface SyncError {
  recordId: string
  table: string
  error: string
  timestamp: number
  data?: unknown
}

export interface SyncProgress {
  isActive: boolean
  total: number
  processed: number
  succeeded: number
  failed: number
  percentage: number
  errors: SyncError[]
  currentTable?: string
  startTime?: number
  estimatedTime?: number
}

let syncProgress: SyncProgress = {
  isActive: false,
  total: 0,
  processed: 0,
  succeeded: 0,
  failed: 0,
  percentage: 0,
  errors: [],
}

let progressListeners: Array<(progress: SyncProgress) => void> = []

/**
 * Suscribirse a cambios de progreso de sincronización
 */
export function onSyncProgress(callback: (progress: SyncProgress) => void) {
  progressListeners.push(callback)
  return () => {
    progressListeners = progressListeners.filter((l) => l !== callback)
  }
}

/**
 * Notificar cambios de progreso
 */
function notifyProgress(progress: SyncProgress) {
  syncProgress = progress
  progressListeners.forEach((listener) => listener(progress))
}

/**
 * Iniciar sincronización
 */
export function startSyncProgress(total: number) {
  notifyProgress({
    isActive: true,
    total,
    processed: 0,
    succeeded: 0,
    failed: 0,
    percentage: 0,
    errors: [],
    startTime: Date.now(),
  })
}

/**
 * Actualizar progreso
 */
export function updateSyncProgress(
  processed: number,
  succeeded: number,
  failed: number,
  currentTable?: string
) {
  const percentage = Math.round((processed / Math.max(syncProgress.total, 1)) * 100)

  notifyProgress({
    ...syncProgress,
    processed,
    succeeded,
    failed,
    percentage,
    currentTable,
  })
}

/**
 * Agregar error de sincronización
 */
export function addSyncError(recordId: string, table: string, error: string, data?: unknown) {
  const newError: SyncError = {
    recordId,
    table,
    error,
    timestamp: Date.now(),
    data,
  }

  notifyProgress({
    ...syncProgress,
    errors: [...syncProgress.errors, newError],
  })
}

/**
 * Finalizar sincronización
 */
export function endSyncProgress() {
  const duration = syncProgress.startTime ? Date.now() - syncProgress.startTime : 0

  notifyProgress({
    ...syncProgress,
    isActive: false,
    estimatedTime: duration,
  })

  // Limpiar después de 3 segundos
  setTimeout(() => {
    notifyProgress({
      isActive: false,
      total: 0,
      processed: 0,
      succeeded: 0,
      failed: 0,
      percentage: 0,
      errors: [],
    })
  }, 3000)
}

/**
 * Obtener progreso actual
 */
export function getCurrentProgress(): SyncProgress {
  return syncProgress
}

/**
 * Limpiar errores
 */
export function clearSyncErrors() {
  notifyProgress({
    ...syncProgress,
    errors: [],
  })
}
