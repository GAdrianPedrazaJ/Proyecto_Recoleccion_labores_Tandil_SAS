import { supabase } from './supabase'
import {
  addToQueue,
  getPendingItems,
  updateItemStatus,
  removeFromQueue,
  getQueueStats,
  clearSynced,
  initSyncQueue,
} from './offlineQueue'
import { acquireLock, releaseLock, renewLock } from './tableLock'

const SYNC_BATCH_SIZE = 10
const INITIAL_RETRY_DELAY = 1000 // 1s
const MAX_RETRY_DELAY = 30000 // 30s
let isSyncing = false
let syncAbortController: AbortController | null = null

export interface SyncStats {
  isOnline: boolean
  isSyncing: boolean
  total: number
  pending: number
  syncing: number
  synced: number
  failed: number
}

let syncStatsListeners: Array<(stats: SyncStats) => void> = []

function notifyStatsChange(stats: SyncStats) {
  syncStatsListeners.forEach((listener) => listener(stats))
}

export function onSyncStatsChange(callback: (stats: SyncStats) => void) {
  syncStatsListeners.push(callback)
  return () => {
    syncStatsListeners = syncStatsListeners.filter((l) => l !== callback)
  }
}

async function getSyncStats(): Promise<SyncStats> {
  const queueStats = await getQueueStats()
  return {
    isOnline: navigator.onLine,
    isSyncing,
    ...queueStats,
  }
}

export async function queueFormularioRow(formularioRowData: any) {
  await initSyncQueue()
  await addToQueue('formulario_row', formularioRowData)
  const stats = await getSyncStats()
  notifyStatsChange(stats)
  // Intentar sincronizar si estamos online
  if (navigator.onLine) {
    startSync()
  }
}

async function uploadBatch(items: any[]): Promise<{ succeeded: string[]; failed: string[] }> {
  const succeeded: string[] = []
  const failed: string[] = []

  // Intentar adquirir lock (retry hasta 3 veces)
  let lockAcquired = false
  for (let attempt = 0; attempt < 3; attempt++) {
    lockAcquired = await acquireLock('formulario_rows')
    if (lockAcquired) break
    await new Promise((r) => setTimeout(r, 1000 * (attempt + 1)))
  }

  if (!lockAcquired) {
    console.warn('Could not acquire lock on formulario_rows, will retry later')
    return { succeeded: [], failed: items.map((i) => i.id) }
  }

  try {
    // Renovar lock mientras procesamos
    const lockRenewalInterval = setInterval(async () => {
      await renewLock('formulario_rows')
    }, 10000) // Cada 10s

    for (const item of items) {
      try {
        // Marcar como syncing
        await updateItemStatus(item.id, 'syncing')
        notifyStatsChange(await getSyncStats())

        // Subir a Supabase
        const { error } = await supabase
          .from('formulario_rows')
          .insert([item.data])

        if (error) throw error

        // Éxito
        await removeFromQueue(item.id)
        succeeded.push(item.id)
      } catch (error) {
        const errorMsg = error instanceof Error ? error.message : String(error)
        await updateItemStatus(item.id, 'failed', errorMsg)
        failed.push(item.id)
      }
    }

    clearInterval(lockRenewalInterval)
  } finally {
    await releaseLock('formulario_rows')
  }

  return { succeeded, failed }
}



export async function startSync() {
  if (isSyncing || !navigator.onLine) return

  isSyncing = true
  syncAbortController = new AbortController()

  try {
    await initSyncQueue()

    while (!syncAbortController.signal.aborted && navigator.onLine) {
      const stats = await getSyncStats()
      notifyStatsChange(stats)

      if (stats.pending === 0) break

      const batch = await getPendingItems(SYNC_BATCH_SIZE)
      if (batch.length === 0) break

      const { succeeded: _uploadedIds, failed } = await uploadBatch(batch)

      // Si falló algo, hacer backoff exponencial
      if (failed.length > 0) {
        const failedCount = failed.length
        const delay = Math.min(
          INITIAL_RETRY_DELAY * Math.pow(2, Math.min(failedCount - 1, 3)),
          MAX_RETRY_DELAY
        )
        console.log(`Retrying in ${delay}ms due to ${failedCount} failed items`)
        await new Promise((r) => setTimeout(r, delay))
      }

      // Notificar cambios
      const newStats = await getSyncStats()
      notifyStatsChange(newStats)
    }

    // Limpiar items sincronizados exitosamente
    await clearSynced()
  } finally {
    isSyncing = false
    syncAbortController = null
    const finalStats = await getSyncStats()
    notifyStatsChange(finalStats)
  }
}

export function stopSync() {
  if (syncAbortController) {
    syncAbortController.abort()
  }
}

// Escuchar cambios de conectividad
window.addEventListener('online', async () => {
  console.log('Device came online, starting sync...')
  const stats = await getSyncStats()
  notifyStatsChange(stats)
  if (stats.pending > 0) {
    startSync()
  }
})

window.addEventListener('offline', async () => {
  console.log('Device went offline')
  stopSync()
  const stats = await getSyncStats()
  notifyStatsChange(stats)
})

// Auto-sync cada 30s si hay items pendientes
setInterval(async () => {
  const stats = await getSyncStats()
  if (stats.pending > 0 && !isSyncing && navigator.onLine) {
    startSync()
  }
}, 30000)
