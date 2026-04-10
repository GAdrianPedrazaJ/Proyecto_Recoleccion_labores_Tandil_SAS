import { openDB, type DBSchema, type IDBPDatabase } from 'idb'

export interface QueuedItem {
  id: string
  type: 'formulario_row'
  data: any
  status: 'pending' | 'syncing' | 'synced' | 'failed'
  createdAt: number
  attempts: number
  lastError?: string
}

export interface LaboresDB extends DBSchema {
  syncQueue: {
    key: string
    value: QueuedItem
  }
}

let db: IDBPDatabase<LaboresDB>

export async function initSyncQueue() {
  db = await openDB<LaboresDB>('labores-sync', 1, {
    upgrade(db) {
      if (!db.objectStoreNames.contains('syncQueue')) {
        db.createObjectStore('syncQueue', { keyPath: 'id' })
      }
    },
  })
}

export async function addToQueue(type: 'formulario_row', data: any) {
  if (!db) await initSyncQueue()
  const item: QueuedItem = {
    id: `${type}_${crypto.randomUUID()}`,
    type,
    data,
    status: 'pending',
    createdAt: Date.now(),
    attempts: 0,
  }
  await db.add('syncQueue', item)
  return item
}

export async function getPendingItems(limit = 20): Promise<QueuedItem[]> {
  if (!db) await initSyncQueue()
  const allItems = await db.getAll('syncQueue')
  return allItems.filter((x) => x.status === 'pending').slice(0, limit)
}

export async function updateItemStatus(
  id: string,
  status: QueuedItem['status'],
  error?: string
) {
  if (!db) await initSyncQueue()
  const item = await db.get('syncQueue', id)
  if (item) {
    item.status = status
    item.attempts++
    if (error) item.lastError = error
    await db.put('syncQueue', item)
  }
}

export async function removeFromQueue(id: string) {
  if (!db) await initSyncQueue()
  await db.delete('syncQueue', id)
}

export async function getQueueStats() {
  if (!db) await initSyncQueue()
  const allItems = await db.getAll('syncQueue')
  return {
    total: allItems.length,
    pending: allItems.filter((x) => x.status === 'pending').length,
    syncing: allItems.filter((x) => x.status === 'syncing').length,
    synced: allItems.filter((x) => x.status === 'synced').length,
    failed: allItems.filter((x) => x.status === 'failed').length,
  }
}

export async function clearSynced() {
  if (!db) await initSyncQueue()
  const syncedItems = await db
    .getAllKeys('syncQueue')
    .then((keys) =>
      Promise.all(
        keys.map(async (key) => {
          const item = await db.get('syncQueue', key)
          return item?.status === 'synced' ? key : null
        })
      )
    )
  for (const key of syncedItems) {
    if (key) await db.delete('syncQueue', key)
  }
}
