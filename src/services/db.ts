import { openDB } from 'idb'
import type { Area, Colaborador, Variedad, Formulario, Usuario } from '../types'

const DB_NAME = 'labores-db'
const DB_VERSION = 4
const MAX_SYNC_ATTEMPTS = 5

const SEED_USUARIOS: Usuario[] = [
  {
    id: 'u1',
    username: 'admin',
    passwordHash: 'admin123',
    rol: 'admin',
    nombre: 'Administrador',
    activo: true,
  },
]

const SEED_AREAS: Area[] = [
  { id: 'a1',  nombre: 'Rosas 1',  sede: 'TN', supervisorId: 'S1',  activo: true },
  { id: 'a2',  nombre: 'Rosas 2',  sede: 'TN', supervisorId: 'S2',  activo: true },
  { id: 'a3',  nombre: 'Rosas 3',  sede: 'TN', supervisorId: 'S3',  activo: true },
  { id: 'a4',  nombre: 'Rosas 4',  sede: 'TN', supervisorId: 'S4',  activo: true },
  { id: 'a5',  nombre: 'Rosas 5',  sede: 'TN', supervisorId: 'S5',  activo: true },
  { id: 'a6',  nombre: 'Rosas 6',  sede: 'TN', supervisorId: 'S6',  activo: true },
  { id: 'a7',  nombre: 'Rosas 7',  sede: 'TN', supervisorId: 'S7',  activo: true },
  { id: 'a8',  nombre: 'Rosas 8',  sede: 'TN', supervisorId: 'S8',  activo: true },
  { id: 'a9',  nombre: 'Rosas 9',  sede: 'TN', supervisorId: 'S9',  activo: true },
  { id: 'a10', nombre: 'Rosas 10', sede: 'TN', supervisorId: 'S10', activo: true },
]

const SEED_COLABORADORES: Colaborador[] = [
  { id: 'c1',  nombre: 'Ana Pérez',         areaId: 'a1', externo: false, activo: true },
  { id: 'c2',  nombre: 'Luis González',      areaId: 'a1', externo: false, activo: true },
  { id: 'c3',  nombre: 'María Rodríguez',    areaId: 'a2', externo: false, activo: true },
  { id: 'c4',  nombre: 'Jorge Martínez',     areaId: 'a2', externo: false, activo: true },
  { id: 'c5',  nombre: 'Sandra López',       areaId: 'a3', externo: true,  activo: true },
  { id: 'c6',  nombre: 'Pedro Jiménez',      areaId: 'a3', externo: true,  activo: true },
  { id: 'c7',  nombre: 'Carmen Silva',       areaId: 'a4', externo: false, activo: true },
  { id: 'c8',  nombre: 'Ricardo Díaz',       areaId: 'a5', externo: false, activo: true },
  { id: 'c9',  nombre: 'Gloria Mora',        areaId: 'a6', externo: false, activo: true },
  { id: 'c10', nombre: 'Héctor Cruz',        areaId: 'a7', externo: true,  activo: true },
]

const SEED_VARIEDADES: Variedad[] = [
  { id: 'v1',  nombre: 'Freedom' },
  { id: 'v2',  nombre: 'Explorer' },
  { id: 'v3',  nombre: 'Vendela' },
  { id: 'v4',  nombre: 'Blush' },
  { id: 'v5',  nombre: 'Mondial' },
  { id: 'v6',  nombre: 'High & Magic' },
  { id: 'v7',  nombre: 'Nena' },
  { id: 'v8',  nombre: 'Topaz' },
  { id: 'v9',  nombre: 'Iguana' },
  { id: 'v10', nombre: 'Lemon Zest' },
]

let dbPromise: ReturnType<typeof openDb> | null = null

function openDb() {
  return openDB(DB_NAME, DB_VERSION, {
    upgrade(database) {
      // Limpiar todos los stores anteriores para migracion limpia
      const names = [...database.objectStoreNames]
      for (const n of names) database.deleteObjectStore(n)

      database.createObjectStore('usuarios', { keyPath: 'id' })
      database.createObjectStore('areas', { keyPath: 'id' })
      const colabStore = database.createObjectStore('colaboradores', { keyPath: 'id' })
      colabStore.createIndex('by-areaId', 'areaId')
      database.createObjectStore('variedades', { keyPath: 'id' })
      const formStore = database.createObjectStore('formularios', { keyPath: 'id' })
      formStore.createIndex('by-fecha', 'fecha')
      database.createObjectStore('config', { keyPath: 'key' })
    },
  })
}

async function getDb() {
  if (!dbPromise) dbPromise = openDb()
  return dbPromise
}

export async function seedIfEmpty(): Promise<void> {
  const db = await getDb()
  const nUsers = await db.count('usuarios')
  if (nUsers === 0) {
    const tx = db.transaction(['usuarios', 'areas', 'colaboradores', 'variedades'], 'readwrite')
    for (const u of SEED_USUARIOS) await tx.objectStore('usuarios').put(u)
    for (const a of SEED_AREAS) await tx.objectStore('areas').put(a)
    for (const c of SEED_COLABORADORES) await tx.objectStore('colaboradores').put(c)
    for (const v of SEED_VARIEDADES) await tx.objectStore('variedades').put(v)
    await tx.done
  }
}

/** --- Usuarios --- */
export async function getAllUsuarios(): Promise<Usuario[]> {
  const db = await getDb()
  return db.getAll('usuarios')
}

export async function getUsuarioByUsername(username: string): Promise<Usuario | undefined> {
  const all = await getAllUsuarios()
  return all.find((u) => u.username === username)
}

export async function putUsuario(u: Usuario): Promise<void> {
  const db = await getDb()
  await db.put('usuarios', u)
}

export async function deleteUsuario(id: string): Promise<void> {
  const db = await getDb()
  await db.delete('usuarios', id)
}

/** --- Areas --- */
export async function getAllAreas(): Promise<Area[]> {
  const db = await getDb()
  return db.getAll('areas')
}

export async function getAreaById(id: string): Promise<Area | undefined> {
  const db = await getDb()
  return db.get('areas', id)
}

export async function putArea(a: Area): Promise<void> {
  const db = await getDb()
  await db.put('areas', a)
}

export async function deleteArea(id: string): Promise<void> {
  const db = await getDb()
  await db.delete('areas', id)
}

/** --- Colaboradores --- */
export async function getAllColaboradores(): Promise<Colaborador[]> {
  const db = await getDb()
  return db.getAll('colaboradores')
}

export async function getColaboradoresByArea(areaId: string): Promise<Colaborador[]> {
  const db = await getDb()
  const all = await db.getAll('colaboradores')
  // NEVER use IDBKeyRange.only(boolean) - filter in JS
  return all.filter((c) => c.areaId === areaId && c.activo)
}

export async function putColaborador(c: Colaborador): Promise<void> {
  const db = await getDb()
  await db.put('colaboradores', c)
}

export async function deleteColaborador(id: string): Promise<void> {
  const db = await getDb()
  await db.delete('colaboradores', id)
}

/** --- Variedades --- */
export async function getAllVariedades(): Promise<Variedad[]> {
  const db = await getDb()
  return db.getAll('variedades')
}

export async function putVariedad(v: Variedad): Promise<void> {
  const db = await getDb()
  await db.put('variedades', v)
}

/** --- Formularios --- */
export async function putFormulario(f: Formulario): Promise<void> {
  const db = await getDb()
  await db.put('formularios', f)
}

export async function getAllFormularios(): Promise<Formulario[]> {
  const db = await getDb()
  const all = await db.getAll('formularios')
  return all.sort((a, b) => b.fechaCreacion.localeCompare(a.fechaCreacion))
}

export async function getFormularioById(id: string): Promise<Formulario | undefined> {
  const db = await getDb()
  return db.get('formularios', id)
}

export async function deleteFormulario(id: string): Promise<void> {
  const db = await getDb()
  await db.delete('formularios', id)
}

export async function getPendientesSincronizacion(): Promise<Formulario[]> {
  const db = await getDb()
  const all = await db.getAll('formularios')
  // NEVER use IDBKeyRange.only(boolean) - filter in JS
  return all.filter(
    (f) =>
      !f.sincronizado &&
      !f.errorPermanente &&
      f.intentosSincronizacion < MAX_SYNC_ATTEMPTS,
  )
}

export async function countNoSincronizados(): Promise<number> {
  const db = await getDb()
  const all = await db.getAll('formularios')
  // NEVER use IDBKeyRange.only(boolean) - filter in JS
  return all.filter((f) => !f.sincronizado && !f.errorPermanente).length
}
