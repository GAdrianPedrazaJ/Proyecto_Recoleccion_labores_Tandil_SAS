import { openDB } from 'idb'
import type {
  Area,
  Colaborador,
  ConfigEntry,
  RegistroColaborador,
  Usuario,
} from '../types'

const DB_NAME = 'labores-db'
const DB_VERSION = 2
const MAX_SYNC_ATTEMPTS = 5

const SEED_USUARIOS: Usuario[] = [
  {
    id: 'u1',
    username: 'admin',
    passwordHash: 'admin123',
    rol: 'admin',
    nombre: 'Administrador',
    areas: [],
    activo: true,
  },
  {
    id: 'u2',
    username: 'leidi',
    passwordHash: 'leidi123',
    rol: 'supervisor',
    nombre: 'Leidi Guerrero',
    areas: ['a1', 'a2'],
    activo: true,
  },
]

const SEED_AREAS: Area[] = [
  {
    id: 'a1',
    nombre: 'Zona Norte Labores',
    tipo: 'Labores',
    sede: 'TN',
    activo: true,
  },
  {
    id: 'a2',
    nombre: 'Zona Sur Corte',
    tipo: 'Corte',
    sede: 'TN',
    activo: true,
  },
]

const SEED_COLABORADORES: Colaborador[] = [
  {
    id: 'c1',
    nombre: 'TRIVIÑO MONTANO JULLY ESMERALDA',
    areaId: 'a1',
    externo: false,
    activo: true,
  },
  {
    id: 'c2',
    nombre: 'MENDEZ ARRIETA CARLOS ANDRES',
    areaId: 'a1',
    externo: false,
    activo: true,
  },
  {
    id: 'c3',
    nombre: 'MURCIA CAÑON BRAYAN STEVEEN',
    areaId: 'a1',
    externo: false,
    activo: true,
  },
  {
    id: 'c4',
    nombre: 'ESTRELLA ORTIZ EVA SANDRI',
    areaId: 'a2',
    externo: false,
    activo: true,
  },
  {
    id: 'c5',
    nombre: 'BUSTOS EMILCE',
    areaId: 'a2',
    externo: false,
    activo: true,
  },
]

let dbPromise: ReturnType<typeof openDb> | null = null

function openDb() {
  return openDB(DB_NAME, DB_VERSION, {
    upgrade(database, oldVersion) {
      if (oldVersion < 2) {
        const names = [...database.objectStoreNames]
        for (const n of names) {
          database.deleteObjectStore(n)
        }
      }
      if (!database.objectStoreNames.contains('usuarios')) {
        database.createObjectStore('usuarios', { keyPath: 'id' })
      }
      if (!database.objectStoreNames.contains('areas')) {
        database.createObjectStore('areas', { keyPath: 'id' })
      }
      if (!database.objectStoreNames.contains('colaboradores')) {
        const st = database.createObjectStore('colaboradores', { keyPath: 'id' })
        st.createIndex('by-areaId', 'areaId')
      }
      if (!database.objectStoreNames.contains('registros')) {
        const st = database.createObjectStore('registros', { keyPath: 'id' })
        st.createIndex('by-sincronizado', 'sincronizado')
        st.createIndex('by-fecha', 'fecha')
      }
      if (!database.objectStoreNames.contains('config')) {
        database.createObjectStore('config', { keyPath: 'key' })
      }
      if (!database.objectStoreNames.contains('areas')) {
        const areas = database.createObjectStore('areas', { keyPath: 'id' })
        areas.createIndex('by-sede', 'sede')
      }
      if (!database.objectStoreNames.contains('supervisors')) {
        database.createObjectStore('supervisors', { keyPath: 'id' })
      }
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
    const tx = db.transaction(
      ['usuarios', 'areas', 'colaboradores'],
      'readwrite',
    )
    for (const u of SEED_USUARIOS) await tx.objectStore('usuarios').put(u)
    for (const a of SEED_AREAS) await tx.objectStore('areas').put(a)
    for (const c of SEED_COLABORADORES) await tx.objectStore('colaboradores').put(c)
    await tx.done
  }
}

/** --- Usuarios --- */
export async function getAllUsuarios(): Promise<Usuario[]> {
  const db = await getDb()
  return db.getAll('usuarios')
}

export async function getUsuarioById(id: string): Promise<Usuario | undefined> {
  const db = await getDb()
  return db.get('usuarios', id)
}

export async function getUsuarioByUsername(
  username: string,
): Promise<Usuario | undefined> {
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

/** --- Áreas --- */
export async function getAllAreas(): Promise<Area[]> {
  const db = await getDb()
  return db.getAll('areas')
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

export async function getColaboradoresByArea(
  areaId: string,
): Promise<Colaborador[]> {
  const db = await getDb()
  const idx = db.transaction('colaboradores').store.index('by-areaId')
  return idx.getAll(areaId)
}

export async function putColaborador(c: Colaborador): Promise<void> {
  const db = await getDb()
  await db.put('colaboradores', c)
}

export async function deleteColaborador(id: string): Promise<void> {
  const db = await getDb()
  await db.delete('colaboradores', id)
}

/** --- Registros (RegistroColaborador) --- */
export async function putRegistro(r: RegistroColaborador): Promise<void> {
  const db = await getDb()
  await db.put('registros', r)
}

export async function getAllRegistros(): Promise<RegistroColaborador[]> {
  const db = await getDb()
  return db.getAll('registros')
}

export async function getPendientesSincronizacion(): Promise<
  RegistroColaborador[]
> {
  const all = await getAllRegistros()
  return all.filter(
    (r) =>
      r.sincronizado === false &&
      !r.errorSincronizacionPermanente &&
      r.intentosSincronizacion < MAX_SYNC_ATTEMPTS,
  )
}

export async function countNoSincronizados(): Promise<number> {
  const all = await getAllRegistros()
  return all.filter((r) => r.sincronizado === false).length
}

export async function countRegistrosHoy(fecha: string): Promise<number> {
  const all = await getAllRegistros()
  return all.filter((r) => r.fecha === fecha).length
}

export async function getRegistrosSincronizados(): Promise<
  RegistroColaborador[]
> {
  const all = await getAllRegistros()
  return all.filter((r) => r.sincronizado)
}

/** --- Config --- */
export async function getConfigKey(key: string): Promise<string | undefined> {
  const db = await getDb()
  const row = await db.get('config', key)
  return row?.value
}

export async function setConfigKey(key: string, value: string): Promise<void> {
  const db = await getDb()
  const row: ConfigEntry = { key, value }
  await db.put('config', row)
}

/** --- Variedades (guardadas como JSON en config) --- */
const VARIEDADES_KEY = 'variedades'

export interface Variedad {
  id: string
  nombre: string
}

export async function getAllVariedades(): Promise<Variedad[]> {
  const raw = await getConfigKey(VARIEDADES_KEY)
  if (!raw) return []
  try {
    return JSON.parse(raw) as Variedad[]
  } catch {
    return []
  }
}

export async function setAllVariedades(variedades: Variedad[]): Promise<void> {
  await setConfigKey(VARIEDADES_KEY, JSON.stringify(variedades))
}
