import { openDB } from 'idb'
import type { Area, Bloque, Colaborador, LaborCatalog, Sede, Supervisor, Variedad, VariedadBloque, Formulario, Usuario } from '../types'

const DB_NAME = 'labores-db'
const DB_VERSION = 6
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

const SEED_SEDES: Sede[] = [
  { id: 'sd1', nombre: 'Tandil' },
]

const SEED_AREAS: Area[] = [
  { id: 'a1',  nombre: 'Rosas 1',  sedeId: 'sd1', supervisorId: 'S1',  activo: true },
  { id: 'a2',  nombre: 'Rosas 2',  sedeId: 'sd1', supervisorId: 'S2',  activo: true },
  { id: 'a3',  nombre: 'Rosas 3',  sedeId: 'sd1', supervisorId: 'S3',  activo: true },
  { id: 'a4',  nombre: 'Rosas 4',  sedeId: 'sd1', supervisorId: 'S4',  activo: true },
  { id: 'a5',  nombre: 'Rosas 5',  sedeId: 'sd1', supervisorId: 'S5',  activo: true },
  { id: 'a6',  nombre: 'Rosas 6',  sedeId: 'sd1', supervisorId: 'S6',  activo: true },
  { id: 'a7',  nombre: 'Rosas 7',  sedeId: 'sd1', supervisorId: 'S7',  activo: true },
  { id: 'a8',  nombre: 'Rosas 8',  sedeId: 'sd1', supervisorId: 'S8',  activo: true },
  { id: 'a9',  nombre: 'Rosas 9',  sedeId: 'sd1', supervisorId: 'S9',  activo: true },
  { id: 'a10', nombre: 'Rosas 10', sedeId: 'sd1', supervisorId: 'S10', activo: true },
]

const SEED_SUPERVISORES: Supervisor[] = [
  { id: 'S1',  nombre: 'Supervisor 1',  areaId: 'a1',  sedeId: 'sd1', activo: true },
  { id: 'S2',  nombre: 'Supervisor 2',  areaId: 'a2',  sedeId: 'sd1', activo: true },
  { id: 'S3',  nombre: 'Supervisor 3',  areaId: 'a3',  sedeId: 'sd1', activo: true },
  { id: 'S4',  nombre: 'Supervisor 4',  areaId: 'a4',  sedeId: 'sd1', activo: true },
  { id: 'S5',  nombre: 'Supervisor 5',  areaId: 'a5',  sedeId: 'sd1', activo: true },
  { id: 'S6',  nombre: 'Supervisor 6',  areaId: 'a6',  sedeId: 'sd1', activo: true },
  { id: 'S7',  nombre: 'Supervisor 7',  areaId: 'a7',  sedeId: 'sd1', activo: true },
  { id: 'S8',  nombre: 'Supervisor 8',  areaId: 'a8',  sedeId: 'sd1', activo: true },
  { id: 'S9',  nombre: 'Supervisor 9',  areaId: 'a9',  sedeId: 'sd1', activo: true },
  { id: 'S10', nombre: 'Supervisor 10', areaId: 'a10', sedeId: 'sd1', activo: true },
]

const SEED_BLOQUES: Bloque[] = [
  { id: 'b1',  nombre: 'Bloque 1',  areaId: 'a1' },
  { id: 'b2',  nombre: 'Bloque 2',  areaId: 'a2' },
  { id: 'b3',  nombre: 'Bloque 3',  areaId: 'a3' },
  { id: 'b4',  nombre: 'Bloque 4',  areaId: 'a4' },
  { id: 'b5',  nombre: 'Bloque 5',  areaId: 'a5' },
  { id: 'b6',  nombre: 'Bloque 6',  areaId: 'a6' },
  { id: 'b7',  nombre: 'Bloque 7',  areaId: 'a7' },
  { id: 'b8',  nombre: 'Bloque 8',  areaId: 'a8' },
  { id: 'b9',  nombre: 'Bloque 9',  areaId: 'a9' },
  { id: 'b10', nombre: 'Bloque 10', areaId: 'a10' },
]

const SEED_COLABORADORES: Colaborador[] = [
  { id: 'c1',  nombre: 'Ana Pérez',         areaId: 'a1', supervisorId: 'S1',  externo: false, asignado: true,  activo: true },
  { id: 'c2',  nombre: 'Luis González',      areaId: 'a1', supervisorId: 'S1',  externo: false, asignado: true,  activo: true },
  { id: 'c3',  nombre: 'María Rodríguez',    areaId: 'a2', supervisorId: 'S2',  externo: false, asignado: true,  activo: true },
  { id: 'c4',  nombre: 'Jorge Martínez',     areaId: 'a2', supervisorId: 'S2',  externo: false, asignado: true,  activo: true },
  { id: 'c5',  nombre: 'Sandra López',       areaId: 'a3', supervisorId: 'S3',  externo: true,  asignado: true,  activo: true },
  { id: 'c6',  nombre: 'Pedro Jiménez',      areaId: 'a3', supervisorId: 'S3',  externo: true,  asignado: true,  activo: true },
  { id: 'c7',  nombre: 'Carmen Silva',       areaId: 'a4', supervisorId: 'S4',  externo: false, asignado: true,  activo: true },
  { id: 'c8',  nombre: 'Ricardo Díaz',       areaId: 'a5', supervisorId: 'S5',  externo: false, asignado: true,  activo: true },
  { id: 'c9',  nombre: 'Gloria Mora',        areaId: 'a6', supervisorId: 'S6',  externo: false, asignado: true,  activo: true },
  { id: 'c10', nombre: 'Héctor Cruz',        areaId: 'a7', supervisorId: 'S7',  externo: true,  asignado: false, activo: true },
]

const SEED_VARIEDADES: Variedad[] = [
  { id: 'v1',  nombre: 'Freedom'      },
  { id: 'v2',  nombre: 'Explorer'     },
  { id: 'v3',  nombre: 'Vendela'      },
  { id: 'v4',  nombre: 'Blush'        },
  { id: 'v5',  nombre: 'Mondial'      },
  { id: 'v6',  nombre: 'High & Magic' },
  { id: 'v7',  nombre: 'Nena'         },
  { id: 'v8',  nombre: 'Topaz'        },
  { id: 'v9',  nombre: 'Iguana'       },
  { id: 'v10', nombre: 'Lemon Zest'   },
]

const ALL_VAR_IDS = ['v1','v2','v3','v4','v5','v6','v7','v8','v9','v10']
const ALL_BLOQUE_IDS = ['b1','b2','b3','b4','b5','b6','b7','b8','b9','b10']
const SEED_VARIEDADES_BLOQUES: VariedadBloque[] = ALL_BLOQUE_IDS.flatMap((bId) =>
  ALL_VAR_IDS.map((vId) => ({ id: `${vId}_${bId}`, variedadId: vId, bloqueId: bId }))
)

const SEED_LABORES: LaborCatalog[] = [
  { id: 'L1', nombre: 'Descabece con pedúnculo' },
  { id: 'L2', nombre: 'Selección de brotes' },
  { id: 'L3', nombre: 'Agobio' },
  { id: 'L4', nombre: 'Activación de tallos' },
  { id: 'L5', nombre: 'Embolce' },
]

let dbPromise: ReturnType<typeof openDb> | null = null

function openDb() {
  return openDB(DB_NAME, DB_VERSION, {
    upgrade(database) {
      // Limpiar todos los stores anteriores para migracion limpia
      const names = [...database.objectStoreNames]
      for (const n of names) database.deleteObjectStore(n)

      database.createObjectStore('usuarios', { keyPath: 'id' })
      database.createObjectStore('sedes', { keyPath: 'id' })
      database.createObjectStore('areas', { keyPath: 'id' })
      database.createObjectStore('supervisores', { keyPath: 'id' })
      database.createObjectStore('bloques', { keyPath: 'id' })
      const colabStore = database.createObjectStore('colaboradores', { keyPath: 'id' })
      colabStore.createIndex('by-areaId', 'areaId')
      database.createObjectStore('variedades', { keyPath: 'id' })
      database.createObjectStore('variedadesBloques', { keyPath: 'id' })
      database.createObjectStore('labores', { keyPath: 'id' })
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
    const tx = db.transaction(
      ['usuarios', 'sedes', 'areas', 'supervisores', 'bloques', 'colaboradores', 'variedades', 'variedadesBloques', 'labores'],
      'readwrite',
    )
    for (const u of SEED_USUARIOS) await tx.objectStore('usuarios').put(u)
    for (const s of SEED_SEDES) await tx.objectStore('sedes').put(s)
    for (const a of SEED_AREAS) await tx.objectStore('areas').put(a)
    for (const s of SEED_SUPERVISORES) await tx.objectStore('supervisores').put(s)
    for (const b of SEED_BLOQUES) await tx.objectStore('bloques').put(b)
    for (const c of SEED_COLABORADORES) await tx.objectStore('colaboradores').put(c)
    for (const v of SEED_VARIEDADES) await tx.objectStore('variedades').put(v)
    for (const vb of SEED_VARIEDADES_BLOQUES) await tx.objectStore('variedadesBloques').put(vb)
    for (const l of SEED_LABORES) await tx.objectStore('labores').put(l)
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

/** --- VariedadesBloques (junction) --- */
export async function getAllVariedadesBloques(): Promise<VariedadBloque[]> {
  const db = await getDb()
  return db.getAll('variedadesBloques')
}

export async function getVariedadesByBloque(bloqueId: string): Promise<Variedad[]> {
  const db = await getDb()
  const junction = await db.getAll('variedadesBloques')
  const variedadIds = new Set(junction.filter((vb) => vb.bloqueId === bloqueId).map((vb) => vb.variedadId))
  const all = await db.getAll('variedades')
  return all.filter((v) => variedadIds.has(v.id))
}

export async function putVariedadBloque(vb: VariedadBloque): Promise<void> {
  const db = await getDb()
  await db.put('variedadesBloques', vb)
}

export async function clearVariedadesBloques(): Promise<void> {
  const db = await getDb()
  await db.clear('variedadesBloques')
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

/** --- Sedes --- */
export async function getAllSedes(): Promise<Sede[]> {
  const db = await getDb()
  return db.getAll('sedes')
}

export async function putSede(s: Sede): Promise<void> {
  const db = await getDb()
  await db.put('sedes', s)
}

/** --- Supervisores --- */
export async function getAllSupervisores(): Promise<Supervisor[]> {
  const db = await getDb()
  return db.getAll('supervisores')
}

export async function getSupervisoresByArea(areaId: string): Promise<Supervisor[]> {
  const db = await getDb()
  const all = await db.getAll('supervisores')
  return all.filter((s) => s.areaId === areaId && s.activo)
}

export async function putSupervisor(s: Supervisor): Promise<void> {
  const db = await getDb()
  await db.put('supervisores', s)
}

/** --- Bloques --- */
export async function getAllBloques(): Promise<Bloque[]> {
  const db = await getDb()
  return db.getAll('bloques')
}

export async function getBloquesByArea(areaId: string): Promise<Bloque[]> {
  const db = await getDb()
  const all = await db.getAll('bloques')
  return all.filter((b) => b.areaId === areaId)
}

export async function putBloque(b: Bloque): Promise<void> {
  const db = await getDb()
  await db.put('bloques', b)
}

/** --- Labores (catálogo) --- */
export async function getAllLabores(): Promise<LaborCatalog[]> {
  const db = await getDb()
  return db.getAll('labores')
}

export async function putLabor(l: LaborCatalog): Promise<void> {
  const db = await getDb()
  await db.put('labores', l)
}
