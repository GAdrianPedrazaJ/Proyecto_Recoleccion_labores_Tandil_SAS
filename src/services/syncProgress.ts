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
  isManuallyOpen: boolean
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
  isManuallyOpen: false,
  total: 0,
  processed: 0,
  succeeded: 0,
  failed: 0,
  percentage: 0,
  errors: [],
}

// Guardar último estado completado para mostrar en historial
let lastCompletedSync: SyncProgress | null = null

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
    isManuallyOpen: false,
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

  // Guardar estado final antes de resetear
  const finalState: SyncProgress = {
    ...syncProgress,
    isActive: false,
    estimatedTime: duration,
  }
  lastCompletedSync = finalState

  notifyProgress(finalState)

  // Limpiar después de 5 segundos solo SI el modal no está abierto manualmente
  setTimeout(() => {
    if (!syncProgress.isManuallyOpen && lastCompletedSync) {
      const cleanState: SyncProgress = {
        ...lastCompletedSync,
        isActive: false,
      }
      notifyProgress(cleanState)
    }
  }, 5000)
}

/**
 * Obtener progreso actual
 */
export function getCurrentProgress(): SyncProgress {
  return syncProgress
}

/**
 * Obtener último estado de sincronización completado
 */
export function getLastCompletedSync(): SyncProgress | null {
  return lastCompletedSync
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

/**
 * Abrir/cerrar modal manualmente
 */
export function toggleSyncProgressModal(open?: boolean) {
  const isManuallyOpen = open !== undefined ? open : !syncProgress.isManuallyOpen
  
  // Si se abre manualmente y no hay sincronización activa, mostrar último estado completado
  if (isManuallyOpen && !syncProgress.isActive && lastCompletedSync) {
    const displaySync: SyncProgress = {
      ...lastCompletedSync,
      isManuallyOpen: true,
    }
    notifyProgress(displaySync)
  } else {
    notifyProgress({
      ...syncProgress,
      isManuallyOpen,
    })
  }
}
