import { openDB } from 'idb'
import type { ConfigRow, FormularioDia } from '../types'

const DB_NAME = 'labores-db'
const DB_VERSION = 1
/** Alineado con sync.ts: no reintentar después de este número de fallos. */
const MAX_SYNC_ATTEMPTS = 5

let dbPromise: ReturnType<typeof openDb> | null = null

function openDb() {
  return openDB(DB_NAME, DB_VERSION, {
    upgrade(database) {
      if (!database.objectStoreNames.contains('formularios')) {
        const formStore = database.createObjectStore('formularios', {
          keyPath: 'id',
        })
        formStore.createIndex('by-sincronizado', 'sincronizado')
        formStore.createIndex('by-fecha', 'fecha')
      }
      if (!database.objectStoreNames.contains('config')) {
        database.createObjectStore('config', { keyPath: 'id' })
      }
    },
  })
}

async function getDb() {
  if (!dbPromise) dbPromise = openDb()
  return dbPromise
}

/** Guarda o actualiza un formulario completo. */
export async function putFormulario(form: FormularioDia): Promise<void> {
  const db = await getDb()
  await db.put('formularios', form)
}

/** Obtiene un formulario por id. */
export async function getFormulario(id: string): Promise<FormularioDia | undefined> {
  const db = await getDb()
  return db.get('formularios', id)
}

/** Lista todos los formularios (ordenar en UI si hace falta). */
export async function getAllFormularios(): Promise<FormularioDia[]> {
  const db = await getDb()
  return db.getAll('formularios')
}

/** Registros pendientes de sincronizar (no sincronizado y sin error permanente). */
export async function getPendientesSincronizacion(): Promise<FormularioDia[]> {
  const db = await getDb()
  const tx = db.transaction('formularios', 'readonly')
  const idx = tx.store.index('by-sincronizado')
  const unsynced = await idx.getAll(IDBKeyRange.only(false))
  await tx.done
  return unsynced.filter(
    (f) =>
      !f.errorSincronizacionPermanente &&
      f.intentosSincronizacion < MAX_SYNC_ATTEMPTS,
  )
}

/** Cuenta registros aún no marcados como sincronizados (incluye error permanente). */
export async function countNoSincronizados(): Promise<number> {
  const db = await getDb()
  const tx = db.transaction('formularios', 'readonly')
  const idx = tx.store.index('by-sincronizado')
  const list = await idx.getAll(IDBKeyRange.only(false))
  await tx.done
  return list.length
}

/** Lee configuración por clave fija, p. ej. id "default". */
export async function getConfig(id: string): Promise<ConfigRow | undefined> {
  const db = await getDb()
  return db.get('config', id)
}

/** Persiste fila de configuración. */
export async function putConfig(row: ConfigRow): Promise<void> {
  const db = await getDb()
  await db.put('config', row)
}
